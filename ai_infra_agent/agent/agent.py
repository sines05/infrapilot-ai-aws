import os
import json
import asyncio
import datetime # Import datetime for timestamp
import re # Import re for regex operations
from typing import Dict, Any, List

from langchain_core.language_models import BaseLanguageModel
from langchain.schema import Generation, LLMResult

from ai_infra_agent.state.manager import StateManager
from ai_infra_agent.infrastructure.tool_factory import ToolFactory
from ai_infra_agent.agent.prompt_builder import PromptBuilder
from ai_infra_agent.core.logging import logger
from ai_infra_agent.services.discovery.scanner import DiscoveryScanner # Import DiscoveryScanner

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic # Import ChatAnthropic


class StateAwareAgent:
    """
    The AI agent that understands the infrastructure state and processes user requests.
    """

    def __init__(self, settings, state_manager: StateManager, tool_factory: ToolFactory, logger, scanner: DiscoveryScanner, llm: BaseLanguageModel = None):
        """
        Initializes the StateAwareAgent.

        Args:
            settings: The agent settings.
            state_manager (StateManager): The manager for infrastructure state.
            tool_factory (ToolFactory): The factory to create tools.
            logger: The logger instance.
            scanner (DiscoveryScanner): The scanner for discovering AWS resources.
            llm (BaseLanguageModel, optional): The language model to use. If None, it will be initialized based on settings.
        """
        self.settings = settings
        self.state_manager = state_manager
        self.tool_factory = tool_factory
        self.logger = logger
        self.scanner = scanner # Store the scanner instance

        if llm:
            self.llm = llm
        else:
            self.llm = self._initialize_llm()

        self.prompt_builder = PromptBuilder()
        self.logger.info("StateAwareAgent initialized.")

    def _initialize_llm(self) -> BaseLanguageModel:
        """
        Initializes the appropriate LLM based on settings.
        """
        provider = self.settings.provider
        model_name = self.settings.model
        temperature = self.settings.temperature
        max_tokens = self.settings.max_tokens

        if provider == "gemini":
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                self.logger.error("GOOGLE_API_KEY not found in environment variables. Gemini LLM cannot be initialized.")
                raise ValueError("GOOGLE_API_KEY is required for Gemini provider.")
            return ChatGoogleGenerativeAI(
                model=model_name,
                temperature=temperature,
                max_output_tokens=max_tokens,
                google_api_key=api_key
            )
        elif provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                self.logger.error("OPENAI_API_KEY not found in environment variables. OpenAI LLM cannot be initialized.")
                raise ValueError("OPENAI_API_KEY is required for OpenAI provider.")
            return ChatOpenAI(
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=api_key
            )
        elif provider == "claude":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                self.logger.error("ANTHROPIC_API_KEY not found in environment variables. Claude LLM cannot be initialized.")
                raise ValueError("ANTHROPIC_API_KEY is required for Claude provider.")
            return ChatAnthropic(
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                anthropic_api_key=api_key
            )
        else:
            self.logger.warning(f"Unknown LLM provider: {provider}. Falling back to a mock LLM.")
            # Fallback to a simple mock LLM if provider is unknown or not configured
            class SimpleMockLLM(BaseLanguageModel):
                def _generate(self, prompts: List[str], stop: List[str] = None) -> LLMResult:
                    self.logger.info("Using Mock LLM. Returning a predefined plan from sample_data.json.")
                    with open('sample_data.json', 'r') as f:
                        data = json.load(f)
                    response_text = json.dumps(data)
                    generations = [[Generation(text=response_text)] for _ in prompts]
                    return LLMResult(generations=generations)
                @property
                def _llm_type(self) -> str:
                    return "simple_mock"
            return SimpleMockLLM()

    def _resolve_placeholders(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolves placeholders in the parameters dictionary.
        For MVP, only {{timestamp}} is resolved.
        """
        resolved_params = {}
        for key, value in params.items():
            if isinstance(value, str) and "{{timestamp}}" in value:
                timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
                resolved_params[key] = value.replace("{{timestamp}}", timestamp)
            else:
                resolved_params[key] = value
        return resolved_params

    async def process_request(self, request: str) -> Dict[str, Any]:
        """
        Processes a user request and generates an execution plan.

        Args:
            request (str): The user's request in natural language.

        Returns:
            Dict[str, Any]: The execution plan generated by the LLM.
        """
        logger.info(f"Processing request: '{request}'")

        # 0. Perform a fresh discovery before processing the request
        self.logger.info("Triggering automatic AWS resource discovery before processing request...")
        discovered_infra_state = await self.scanner.scan_aws_resources()
        self.state_manager.set_discovered_state(discovered_infra_state)
        self.logger.info("Automatic AWS resource discovery completed.")

        # 1. Gather context
        # Get formatted current state from StateManager (now includes discovered state)
        current_state_formatted = self.state_manager.get_current_state_formatted()
        logger.debug(f"Formatted current state:\n{current_state_formatted}")

        # Get formatted tool definitions from PromptBuilder
        tools_context = self.prompt_builder.tools_context_template
        logger.debug(f"Formatted tool definitions:\n{tools_context}") # Corrected f-string

        # 2. Build the prompt
        prompt = self.prompt_builder.build(
            request=request,
            tools_context=tools_context,
            current_state_formatted=current_state_formatted
        )
        logger.debug(f"Generated Prompt:\n{prompt}\n")

        # 3. Interact with the LLM
        try:
            logger.info("Sending prompt to LLM...")
            # Log the full prompt to a file for debugging
            with open("llm_request.log", "w", encoding="utf-8") as f:
                f.write(prompt)
            logger.debug("Full LLM prompt saved to llm_request.log")
            # Run the synchronous LLM call in a separate thread
            llm_response_obj = await asyncio.to_thread(self.llm.invoke, prompt)
            llm_response = llm_response_obj.content
            logger.debug(f"Raw LLM response:\n{llm_response}") # Added debug log for raw response
            try:
                # Remove markdown code block if present
                json_match = re.search(r"```json\s*(.*?)\s*```", llm_response, re.DOTALL)
                if json_match:
                    cleaned_llm_response = json_match.group(1)
                    logger.debug("Removed markdown code block from LLM response.")
                else:
                    cleaned_llm_response = llm_response
                    logger.debug("No markdown code block found in LLM response.")

                plan = json.loads(cleaned_llm_response)
                logger.debug(f"Parsed LLM plan:\n{json.dumps(plan, indent=2)}") # Added debug log for parsed plan
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode LLM response into JSON: {e}")
                logger.error(f"Problematic LLM response content: {llm_response[:500]}...") # Log first 500 chars
                plan = {"error": "LLM returned invalid JSON.", "details": str(e)}
        except Exception as e:
            logger.error(f"An error occurred during LLM interaction: {e}")
            plan = {"error": str(e)}


        # 4. Return the plan (no complex validation in MVP)
        return plan

    async def execute_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """
        Executes a specific tool by name.
        """
        self.logger.info(f"Executing tool '{tool_name}' with params: {kwargs}")
        
        # Resolve placeholders in kwargs before executing the tool
        resolved_kwargs = self._resolve_placeholders(kwargs)
        self.logger.debug(f"Resolved tool parameters: {resolved_kwargs}")

        tool = self.tool_factory.create_tool(tool_name) # Corrected method call
        # The create_tool method already raises ValueError if not found, so no need for explicit check here.
        
        # The tool's execute method is synchronous, so we run it in an executor
        # to avoid blocking the asyncio event loop.
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: tool.execute(**resolved_kwargs))
        self.logger.info(f"Tool '{tool_name}' executed successfully.")
        return result
