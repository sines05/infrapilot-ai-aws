from supabase import create_client, Client
import os
from loguru import logger
from typing import Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

# --- Simplified Configuration Loading ---
# For backend operations, we now require the SERVICE_ROLE_KEY and a direct DATABASE_URL.
# The ANON_KEY is for frontend use only and is not referenced here.
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Initializes the Supabase client, exclusively for Auth operations.
    Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Fails loudly if they are not set.
    """
    global _client
    if _client is None:
        if not SUPABASE_URL:
            raise RuntimeError("Supabase URL is not configured. Please set NEXT_PUBLIC_SUPABASE_URL.")
        if not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("Supabase Service Role Key is not configured. Please set SUPABASE_SERVICE_ROLE_KEY for backend operations.")

        try:
            logger.info("Initializing Supabase client with SERVICE_ROLE_KEY for authentication.")
            _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}")
            raise
    return _client


def verify_user_token(token: str) -> Dict[str, str]:
    """
    Verifies a Supabase JWT and returns minimal user info {user_id, email}.
    Raises RuntimeError on failure.
    """
    supabase = get_supabase_client()
    try:
        resp = supabase.auth.get_user(token)
        user = getattr(resp, 'user', None)
        if not user:
            raise RuntimeError("Invalid token or user not found in JWT.")
        
        return {"user_id": user.id, "email": user.email}
    except Exception as e:
        logger.error(f"Supabase token verification failed: {e}")
        raise RuntimeError("Token verification failed.")


def _get_db_connection():
    """Helper function to get a direct PostgreSQL connection."""
    if not DATABASE_URL:
        raise RuntimeError("Direct database connection string is not configured. Please set DATABASE_URL.")
    try:
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        logger.error(f"Failed to connect to the database directly: {e}")
        raise RuntimeError("Database connection failed.")


def get_user_aws_credentials(user_id: str) -> Dict[str, str]:
    """
    Fetches AWS credentials for a user directly from the database.
    Requires DATABASE_URL and that all credentials are set in the user's profile.
    Raises ValueError if any credential (key, secret, region) is missing.
    """
    logger.info(f"Fetching AWS credentials for user_id: {user_id} via direct DB connection.")
    conn = _get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT aws_access_key, aws_secret_key, aws_region FROM users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                raise ValueError("AWS credentials not found for this user in the database.")

            access_key = row.get("aws_access_key")
            secret_key = row.get("aws_secret_key")
            region = row.get("aws_region")

            if not all([access_key, secret_key, region]):
                missing = []
                if not access_key: missing.append("AWS Access Key")
                if not secret_key: missing.append("AWS Secret Key")
                if not region: missing.append("AWS Region")
                raise ValueError(f"Missing required AWS credentials in user profile: {', '.join(missing)}. Please update your settings.")

            logger.info(f"Successfully fetched AWS credentials for user {user_id}")
            return {
                "access_key_id": access_key,
                "secret_access_key": secret_key,
                "region": region,
            }
    except ValueError:
        raise  # Re-raise ValueError to be caught by the caller
    except Exception as e:
        logger.error(f"Failed to fetch AWS credentials for user {user_id}: {e}", exc_info=True)
        raise RuntimeError(f"A database error occurred while fetching AWS credentials.")
    finally:
        conn.close()


def get_user_google_credentials(user_id: str) -> Dict[str, str]:
    """
    Fetches Google API key for a user directly from the database.
    Requires DATABASE_URL and that the key is set in the user's profile.
    Raises ValueError if the key is missing.
    """
    logger.info(f"Fetching Google API key for user_id: {user_id} via direct DB connection.")
    conn = _get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT google_api_key FROM users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row or not row.get("google_api_key"):
                raise ValueError("Google API Key not found in user profile. Please update your settings.")

            logger.info(f"Successfully fetched Google API key for user {user_id}")
            return {"api_key": row.get("google_api_key")}
    except ValueError:
        raise # Re-raise ValueError to be caught by the caller
    except Exception as e:
        logger.error(f"Failed to fetch Google credentials for user {user_id}: {e}", exc_info=True)
        raise RuntimeError("A database error occurred while fetching Google credentials.")
    finally:
        conn.close()