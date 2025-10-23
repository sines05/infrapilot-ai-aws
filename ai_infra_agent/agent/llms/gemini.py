import google.generativeai as genai
from langchain.llms.base import BaseLLM
from langchain.schema import Generation, LLMResult
from typing import List, Dict, Any, Optional

class GeminiLLM(BaseLLM):
    """
    Custom LangChain LLM for Google Gemini.
    """
    model_name: str
    temperature: float
    max_tokens: int
    api_key: str
    logger: Any # Using Any for logger type for simplicity

    def __init__(self, **data: Any):
        super().__init__(**data)
        genai.configure(api_key=self.api_key)
        self.logger.info(f"GeminiLLM initialized with model: {self.model_name}")

    @property
    def _llm_type(self) -> str:
        return "gemini"

    def _generate(self, prompts: List[str], stop: Optional[List[str]] = None) -> LLMResult:
        generations = []
        for prompt in prompts:
            try:
                model = genai.GenerativeModel(self.model_name)
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=self.temperature,
                        max_output_tokens=self.max_tokens,
                        stop_sequences=stop,
                    ),
                )
                # Assuming the response has a 'text' attribute for the generated content
                # and that we only care about the first candidate.
                generated_text = response.candidates[0].content.parts[0].text
                generations.append([Generation(text=generated_text)])
            except Exception as e:
                self.logger.error(f"Error calling Gemini API: {e}")
                generations.append([Generation(text=f"Error: {e}")]) # Return error in generation
        return LLMResult(generations=generations)

    async def _agenerate(self, prompts: List[str], stop: Optional[List[str]] = None) -> LLMResult:
        # Implement asynchronous generation if needed, for now, just call synchronous
        return self._generate(prompts, stop)

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        return {
            "model_name": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }
