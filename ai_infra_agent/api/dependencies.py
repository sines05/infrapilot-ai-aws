from functools import lru_cache
from loguru import logger
from typing import Dict, Optional, Any

# --- Core Imports ---
from ai_infra_agent.core.config import settings # Keep for settings.agent
from ai_infra_agent.core.logging import setup_logger

# --- State Imports ---
from ai_infra_agent.state.manager import StateManager

# --- Infrastructure Imports ---
from ai_infra_agent.infrastructure.tool_factory import ToolFactory

# --- Agent & Discovery Imports ---
from ai_infra_agent.agent.agent import StateAwareAgent
from ai_infra_agent.services.discovery.scanner import DiscoveryScanner

# Supabase client (server-side) utilities
from ai_infra_agent.core.supabase_client import (
    verify_user_token,
    get_user_aws_credentials,
    get_user_google_credentials,
)

from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)


@lru_cache(maxsize=None)
def get_logger() -> logger:
    """Provide a configured logger instance."""
    return setup_logger(settings)


@lru_cache(maxsize=None)
def get_state_manager() -> StateManager:
    """Provide a singleton StateManager instance."""
    log = get_logger()
    log.info("Initializing StateManager singleton...")
    return StateManager(log)


@lru_cache(maxsize=None)
def get_tool_factory() -> ToolFactory:
    """
    Provide a singleton ToolFactory instance.
    This factory only registers tool classes and provides them on demand with user credentials.
    """
    log = get_logger()
    log.info("Initializing ToolFactory singleton...")
    factory = ToolFactory(logger=log)
    try:
        count = len(factory.get_tool_names())
    except Exception:
        count = 0
    log.info(f"ToolFactory initialized with {count} tools.")
    return factory


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> Dict[str, str]:
    """
    Verify Supabase JWT (passed as Bearer token) and return user info dict {user_id, email}.
    Falls back to X-User-Id header if token verification fails (for development).
    """
    # Try to verify token first
    if credentials and credentials.credentials:
        token = credentials.credentials
        try:
            user = verify_user_token(token)
            return user
        except Exception as e:
            get_logger().warning(f"Token verification failed: {e}, trying X-User-Id header")
    
    # Fallback: Use X-User-Id header if provided (for development)
    if x_user_id:
        get_logger().info(f"Using X-User-Id header for authentication: {x_user_id}")
        # Try to fetch user email from database, but don't fail if it doesn't work
        email = ""
        try:
            import os
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            # Try direct PostgreSQL connection first (bypasses RLS)
            database_url = os.getenv("DATABASE_URL")
            if database_url:
                try:
                    conn = psycopg2.connect(database_url)
                    try:
                        with conn.cursor(cursor_factory=RealDictCursor) as cur:
                            cur.execute("SELECT email FROM users WHERE id = %s", (x_user_id,))
                            row = cur.fetchone()
                            if row:
                                email = row.get("email", "")
                    finally:
                        conn.close()
                except Exception as e:
                    get_logger().warning(f"Direct PostgreSQL connection failed: {e}, trying Supabase client")
            
            # Fallback to Supabase client if direct connection failed or not available
            if not email:
                from ai_infra_agent.core.supabase_client import get_supabase_client
                supabase = get_supabase_client()
                resp = supabase.table("users").select("email").eq("id", x_user_id).maybe_single().execute()
                data = getattr(resp, "data", None) or (resp and resp.get("data"))
                if data:
                    email = data.get("email", "")
        except Exception as e:
            # Log warning but don't fail - email is optional
            get_logger().warning(f"Could not fetch user email for X-User-Id {x_user_id}: {e}. Continuing without email.")
        return {"user_id": x_user_id, "email": email}
    
    # No valid authentication method
    get_logger().error("Authentication failed: No valid token or X-User-Id header")
    raise HTTPException(status_code=401, detail="Invalid or expired token. Provide Bearer token or X-User-Id header.")


def get_user_credentials(user: Dict[str, str] = Depends(get_current_user)) -> Dict:
    """Fetch per-user AWS and Google credentials from Supabase for the authenticated user."""
    user_id = user["user_id"]
    try:
        aws = get_user_aws_credentials(user_id)
        google = get_user_google_credentials(user_id)
        return {"user_id": user_id, "email": user.get("email"), "aws": aws, "google": google}
    except Exception as e:
        get_logger().error(f"Failed fetching credentials for user {user_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


def get_scanner(user_creds: Dict[str, Any] = Depends(get_user_credentials)) -> DiscoveryScanner:
    """
    Provide a DiscoveryScanner instance configured with user-specific credentials.
    This is not a singleton as it's user-specific.
    """
    log = get_logger()
    aws_creds = user_creds.get("aws")
    if not aws_creds:
        raise HTTPException(
            status_code=400,
            detail="AWS credentials not found for this user. Please configure your AWS keys in your profile."
        )
    
    log.info(f"Creating DiscoveryScanner for user {user_creds.get('user_id')}")
    tool_factory = get_tool_factory()
    return DiscoveryScanner(tool_factory=tool_factory, user_aws_config=aws_creds)


def get_agent(user_creds: Dict[str, Any] = Depends(get_user_credentials)) -> StateAwareAgent:
    """
    Create a StateAwareAgent bound to the provided user's credentials.
    This is not a singleton as it's user-specific.
    """
    log = get_logger()
    log.debug(f"Creating per-request agent for user {user_creds.get('user_id')}")
    state_mgr = get_state_manager()
    tool_factory = get_tool_factory()
    agent = StateAwareAgent(
        settings=settings.agent, # Assuming settings.agent is a global configuration needed by the agent logic
        state_manager=state_mgr,
        tool_factory=tool_factory,
        logger=log,
        scanner=get_scanner(user_creds=user_creds), # Pass user_creds to get_scanner
        user_credentials=user_creds,
    )
    return agent
