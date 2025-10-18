from typing import List, Dict, Any

class PromptBuilder:
    """
    A simple class to build prompts for the LLM.
    """

    def __init__(self, template: str = None):
        """
        Initializes the PromptBuilder.

        Args:
            template (str, optional): A template string for the prompt. 
                                      Defaults to a predefined template if None.
        """
        self.template = template or self._get_default_template()

    def _get_default_template(self) -> str:
        """
        Returns the default prompt template.
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

    def build(self, state: Dict[str, Any], tools: List[str], request: str) -> str:
        """
        Builds the final prompt string.

        Args:
            state (Dict[str, Any]): The current infrastructure state.
            tools (List[str]): A list of available tool names.
            request (str): The user's request.

        Returns:
            str: The formatted prompt string.
        """
        # Simple serialization for now. In a real scenario, this would be more robust.
        state_str = str(state) 
        tools_str = "\n".join([f"- {tool}" for tool in tools])

        return self.template.format(
            state=state_str,
            tools=tools_str,
            request=request
        )