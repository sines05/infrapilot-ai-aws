from typing import List, Dict, Any
from pathlib import Path # Added import for Path
from ai_infra_agent.core.config import settings, ROOT_DIR # Import ROOT_DIR
import yaml # Import yaml for loading config files

class PromptBuilder:
    """
    A simple class to build prompts for the LLM.
    """

    def __init__(self):
        """
        Initializes the PromptBuilder by loading the template from a file.
        """
        template_file_path = ROOT_DIR / settings.agent.template_path
        try:
            with open(template_file_path, 'r', encoding='utf-8') as f:
                self.template = f.read()
            print(f"--- INFO: Loaded prompt template from {template_file_path} ---")
        except FileNotFoundError:
            print(f"--- ERROR: Prompt template file not found at {template_file_path}. Using default hardcoded template. ---")
            self.template = self._get_default_template()
        except Exception as e:
            print(f"--- ERROR: Failed to load prompt template from {template_file_path}: {e}. Using default hardcoded template. ---")
            self.template = self._get_default_template() # Corrected typo here

        # Load resource patterns and field mappings
        self.resource_patterns = self._load_yaml_file(ROOT_DIR / "settings/resource-patterns-enhanced.yaml")
        self.field_mappings = self._load_yaml_file(ROOT_DIR / "settings/field-mappings-enhanced.yaml")

        # Load the tools execution context template
        self.tools_context_template = self._load_text_file(ROOT_DIR / "settings/templates/tools-execution-context-optimized.txt")

    def _load_yaml_file(self, file_path: Path) -> str:
        """Loads a YAML file and returns its content as a string."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print(f"--- ERROR: YAML file not found at {file_path}. ---")
            return ""
        except Exception as e:
            print(f"--- ERROR: Failed to load YAML file {file_path}: {e}. ---")
            return ""

    def _load_text_file(self, file_path: Path) -> str:
        """Loads a text file and returns its content as a string."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print(f"--- ERROR: Text file not found at {file_path}. ---")
            return ""
        except Exception as e:
            print(f"--- ERROR: Failed to load text file {file_path}: {e}. ---")
            return ""

    def _get_default_template(self) -> str:
        """
        Returns a hardcoded default prompt template if the file is not found.
        This should ideally be avoided in production.
        """
        return """
You are an expert AI assistant for managing AWS infrastructure.
Your task is to generate a JSON plan of tool calls to fulfill the user's request.

**Context:**

**Current Infrastructure State:**
{state}

**Available Tools:**
{tools}

**User Request:**
"{request}"

**Instructions:**
- Analyze the user's request and the current state.
- Create a JSON array of tool calls to achieve the request.
- Each object in the array must have a "tool_name" and "parameters".
- If a tool requires no parameters, use an empty object {{}}.
- Only use the tools listed above.
- If the request cannot be fulfilled with the available tools, return an empty JSON array [].

**JSON Plan:**
"""

    def build(self, request: str, tools_context: str, current_state_formatted: str) -> str:
        """
        Builds the final prompt string.

        Args:
            request (str): The user's request.
            tools_context (str): The formatted string of all available tool definitions.
            current_state_formatted (str): The formatted string representing the current infrastructure state.

        Returns:
            str: The formatted prompt string.
        """
        # Debug print statements
        print(f"--- DEBUG: Prompt Template (first 500 chars):\n{self.template[:500]}...")
        print(f"--- DEBUG: Formatting args: request type={{type(request)}}, tools_context type={{type(tools_context)}}, current_state_formatted type={{type(current_state_formatted)}}")

        return self.template.format(
            request=request,
            tools=tools_context,
            state=current_state_formatted,
            resource_patterns=self.resource_patterns,
            field_mappings=self.field_mappings,
            aws_region=settings.aws.region # Inject the region from config
        )
