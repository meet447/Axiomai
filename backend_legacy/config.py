from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
UNIO_API_KEY = os.getenv('UNIO_API_KEY')

# Dynamic AI Provider Configuration
LLM_BASE_URL = os.getenv('LLM_BASE_URL', 'https://api.openai.com/v1')
LLM_API_KEY = os.getenv('LLM_API_KEY')
MODEL_FAST = os.getenv('MODEL_FAST', 'gpt-3.5-turbo')
MODEL_POWERFUL = os.getenv('MODEL_POWERFUL', 'gpt-4')
MODEL_HYPER = os.getenv('MODEL_HYPER', 'gpt-3.5-turbo')