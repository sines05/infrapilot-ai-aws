from supabase import create_client, Client
import os
from loguru import logger
from typing import Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# Always prefer service role key for backend operations (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
DATABASE_URL = os.getenv("DATABASE_URL")  # Direct PostgreSQL connection

_client: Optional[Client] = None

def get_supabase_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL:
            raise RuntimeError("Supabase URL not configured in environment (NEXT_PUBLIC_SUPABASE_URL)")
        if not SUPABASE_KEY:
            raise RuntimeError("Supabase Key not configured. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY")
        if not SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("Using NEXT_PUBLIC_SUPABASE_ANON_KEY. For backend operations, SUPABASE_SERVICE_ROLE_KEY is recommended to bypass RLS.")
        else:
            logger.info("Using SUPABASE_SERVICE_ROLE_KEY for backend operations (bypasses RLS)")
            # Verify the key looks correct (service role keys are longer)
            if len(SUPABASE_SERVICE_ROLE_KEY) < 100:
                logger.warning(f"Service role key seems too short ({len(SUPABASE_SERVICE_ROLE_KEY)} chars). Make sure you're using the service_role key, not anon key.")
        
        # Create client with explicit options for service role key
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.debug(f"Supabase client initialized with URL: {SUPABASE_URL[:30]}...")
            # Test the connection by making a simple query
            if SUPABASE_SERVICE_ROLE_KEY:
                # Try to verify the key works by checking if we can access the database
                # This is a lightweight test
                logger.debug("Service role key configured, should bypass RLS")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}")
            raise
    return _client

def verify_user_token(token: str) -> Dict[str, str]:
    """
    Verify Supabase JWT and return minimal user info {user_id, email}.
    Raises RuntimeError on failure.
    """
    supabase = get_supabase_client()
    try:
        resp = supabase.auth.get_user(token)
        # handle different return shapes
        user = None
        if hasattr(resp, "user"):
            user = resp.user
        elif isinstance(resp, dict):
            user = resp.get("user")
        if not user:
            raise RuntimeError("Invalid token / user not found")
        return {"user_id": user.get("id"), "email": user.get("email")}
    except Exception as e:
        logger.error(f"Supabase token verify error: {e}")
        raise RuntimeError("Token verification failed")

def get_user_aws_credentials(user_id: str) -> Dict[str, str]:
    """
    Fetch AWS credentials from users table for user_id.
    Expected fields in DB: aws_access_key, aws_secret_key, aws_region
    Returns: access_key_id, secret_access_key, region (mapped for compatibility)
    
    Uses direct PostgreSQL connection if DATABASE_URL is available to bypass RLS issues.
    Falls back to Supabase client if DATABASE_URL is not set.
    """
    # Try direct PostgreSQL connection first (bypasses RLS)
    if DATABASE_URL:
        try:
            logger.info(f"Attempting direct PostgreSQL connection for user_id: {user_id}")
            conn = psycopg2.connect(DATABASE_URL)
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT aws_access_key, aws_secret_key, aws_region FROM users WHERE id = %s",
                        (user_id,)
                    )
                    row = cur.fetchone()
                    if not row:
                        logger.warning(f"No AWS credentials found in database for user {user_id}")
                        raise RuntimeError("No AWS credentials found for user")
                    logger.info(f"Successfully fetched AWS credentials via PostgreSQL for user {user_id}")
                    return {
                        "access_key_id": row.get("aws_access_key"),
                        "secret_access_key": row.get("aws_secret_key"),
                        "region": row.get("aws_region") or os.getenv("AWS_REGION") or "us-east-1",
                    }
            finally:
                conn.close()
        except Exception as e:
            logger.error(f"Direct PostgreSQL connection failed: {e}", exc_info=True)
            logger.warning("Falling back to Supabase client (may encounter RLS issues)")
    else:
        logger.warning("DATABASE_URL not set, using Supabase client (may encounter RLS issues)")
    
    # Fallback to Supabase client
    supabase = get_supabase_client()
    try:
        logger.debug(f"Fetching AWS credentials via Supabase client for user_id: {user_id}")
        resp = supabase.table("users").select("aws_access_key,aws_secret_key,aws_region").eq("id", user_id).maybe_single().execute()
        data = getattr(resp, "data", None) or (resp and resp.get("data"))
        if not data:
            logger.warning(f"No AWS credentials found in database for user {user_id}")
            raise RuntimeError("No AWS credentials found for user")
        logger.debug(f"Successfully fetched AWS credentials for user {user_id}")
        return {
            "access_key_id": data.get("aws_access_key"),
            "secret_access_key": data.get("aws_secret_key"),
            "region": data.get("aws_region") or os.getenv("AWS_REGION") or "us-east-1",
        }
    except RuntimeError:
        # Re-raise RuntimeError as-is
        raise
    except Exception as e:
        logger.error(f"Failed to fetch AWS creds for user {user_id}: {e}", exc_info=True)
        # Check if it's a 401 error
        error_str = str(e)
        if "401" in error_str or "Unauthorized" in error_str:
            logger.error("401 Unauthorized error. Make sure SUPABASE_SERVICE_ROLE_KEY is set correctly to bypass RLS, or use DATABASE_URL for direct PostgreSQL connection.")
        raise RuntimeError(f"Failed to fetch AWS credentials: {str(e)}")

def get_user_google_credentials(user_id: str) -> Dict[str, str]:
    """
    Fetch Google API key from users table for user_id.
    Expected field in DB: google_api_key
    
    Uses direct PostgreSQL connection if DATABASE_URL is available to bypass RLS issues.
    Falls back to Supabase client if DATABASE_URL is not set.
    """
    # Try direct PostgreSQL connection first (bypasses RLS)
    if DATABASE_URL:
        try:
            logger.debug(f"Attempting direct PostgreSQL connection for Google API key, user_id: {user_id}")
            conn = psycopg2.connect(DATABASE_URL)
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT google_api_key FROM users WHERE id = %s",
                        (user_id,)
                    )
                    row = cur.fetchone()
                    if not row or not row.get("google_api_key"):
                        return {}
                    logger.debug(f"Successfully fetched Google API key via PostgreSQL for user {user_id}")
                    return {"api_key": row.get("google_api_key")}
            finally:
                conn.close()
        except Exception as e:
            logger.warning(f"Direct PostgreSQL connection failed for Google API key: {e}, falling back to Supabase client")
    
    # Fallback to Supabase client
    supabase = get_supabase_client()
    try:
        resp = supabase.table("users").select("google_api_key").eq("id", user_id).maybe_single().execute()
        data = getattr(resp, "data", None) or (resp and resp.get("data"))
        if not data or not data.get("google_api_key"):
            return {}
        return {"api_key": data.get("google_api_key")}
    except Exception as e:
        logger.error(f"Failed to fetch Google creds for user {user_id}: {e}")
        return {}