# ai_infra_agent/core/config.py
import os
from pathlib import Path
from typing import Optional, Dict, Any

import yaml
from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# --- Step 1: Define the root directory and load the .env file ---
# This ensures that environment variables are loaded before Pydantic tries to read them.
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
dotenv_path = ROOT_DIR / '.env'
if dotenv_path.exists():
    print(f"--- INFO: Loading environment variables from {dotenv_path} ---")
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f"--- WARNING: .env file not found at {dotenv_path} ---")


# --- Step 2: Define the Pydantic Models as simple BaseModels ---
# They don't need to know about env prefixes anymore.
class AWSSettings(BaseModel):
    """AWS-specific configuration"""
    region: str = Field("us-west-2", description="Default AWS region")
    access_key_id: Optional[SecretStr] = Field(None, description="AWS Access Key ID")
    secret_access_key: Optional[SecretStr] = Field(None, description="AWS Secret Access Key")
    max_retries: int = Field(5, description="Maximum number of retries for AWS API calls")
    timeout: int = Field(60, description="Timeout in seconds for AWS API calls")

class AgentSettings(BaseModel):
    """Configuration for the AI agent"""
    provider: str = Field("openai", description="LLM provider")
    model: str = Field("gpt-4", description="Default LLM model")
    api_key: Optional[SecretStr] = Field(None, description="API key for the LLM provider")
    template_path: str = Field("settings/templates/decision-plan-prompt-optimized.txt", description="Path to the prompt template file")
    max_tokens: int = Field(10000, description="Maximum number of tokens for LLM response")
    temperature: float = Field(0.1, description="Temperature for LLM response generation")
    # Add other agent settings if needed

class LoggingSettings(BaseModel):
    """Logging configuration"""
    level: str = Field("INFO", description="Logging level")
    format: str = Field("text", description="Log format (text or json)")
    output: str = Field("stdout", description="Log output (stdout or file path)")

class StateSettings(BaseModel):
    """State management configuration"""
    file_path: str = Field("states/infrastructure-state.json", description="Path to the state file")
    
class WebSettings(BaseModel):
    """Web server configuration"""
    port: int = Field(8080, description="Web server port")
    host: str = Field("127.0.0.1", description="Web server host")

# This class will now be much simpler
class Settings(BaseModel):
    """Main configuration settings container"""
    aws: AWSSettings = Field(default_factory=AWSSettings)
    agent: AgentSettings = Field(default_factory=AgentSettings)
    logging: LoggingSettings = Field(default_factory=LoggingSettings)
    state: StateSettings = Field(default_factory=StateSettings)
    web: WebSettings = Field(default_factory=WebSettings)

# --- Step 3: Create a single, explicit function to build the settings object ---
def load_app_settings() -> Settings:
    """
    Loads configuration from environment variables and config.yaml.
    Environment variables always take precedence.
    """
    # Start with empty settings
    settings_data = {}
    
    # Load from YAML file first (if it exists)
    config_file = ROOT_DIR / 'config.yaml'
    if config_file.exists():
        with open(config_file, 'r') as f:
            yaml_data = yaml.safe_load(f)
            if yaml_data:
                settings_data.update(yaml_data)
                
    # Now, override with environment variables MANUALLY.
    # This is explicit and cannot fail silently.
    
    # We create a dictionary from env vars that we care about.
    env_vars = {
        "aws": {
            "region": os.getenv("AWS_REGION"),
            "access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
            "secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        },
        "agent": {
            "api_key": os.getenv("GEMINI_API_KEY"),
        },
        "web": {
            "host": os.getenv("WEB_HOST"),
            "port": os.getenv("WEB_PORT"),
        }
        # Add other sections like 'agent', 'logging' if needed
    }
    
    # A helper to merge dictionaries recursively, prioritizing the second dict
    def merge_dicts(d1, d2):
        for k, v in d2.items():
            if k in d1 and isinstance(d1[k], dict) and isinstance(v, dict):
                d1[k] = merge_dicts(d1[k], v)
            # Only update if the value from env is not None
            elif v is not None:
                if k not in d1:
                    d1[k] = {}
                d1[k] = v
        return d1

    # Merge env_vars into our settings_data
    final_config_data = merge_dicts(settings_data, env_vars)
    
    # Finally, create the Pydantic model from the combined data
    return Settings.model_validate(final_config_data)

# --- Step 4: Create the global settings instance ---
settings = load_app_settings()

# Optional debug print to confirm
print("--- SETTINGS LOADED ---")
print(f"AWS Region: {settings.aws.region}")
key_id = settings.aws.access_key_id.get_secret_value() if settings.aws.access_key_id else "Not Set"
print(f"AWS Key Loaded: {'Yes' if key_id != 'Not Set' else 'No'}")
print("-----------------------")