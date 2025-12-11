import json
from typing import AsyncGenerator
from google import genai
from config import LLM_BASE_URL, LLM_API_KEY
import openai 

#uncomment if you want to use google  genai
# async def chat_with_model(
#     message: str,
#     model: str = 'gemini-2.5-flash-lite',
# ) -> AsyncGenerator[str, None]:
    
    
#     client = genai.Client(api_key=GEMINI_API_KEY)
    
#     response = client.models.generate_content_stream(
#         model=model,
#         contents=message,
#     )
    
#     for chunk in response:
#         yield f'data: {json.dumps({"event": "text-chunk", "data": {"text": chunk.text}})}'
    
#     yield "data: DONE"
#     return


async def chat_with_model(
    message: str,
    # Default model if none provided, though usually controlled by caller
    model: str = 'gpt-3.5-turbo',
) -> AsyncGenerator[str, None]:
    
    
    client = openai.AsyncClient(
        base_url=LLM_BASE_URL,
        api_key=LLM_API_KEY
    )
    
    messages = [
        {"role": "user", "content": message}
    ]
    
    # Note: caller is expected to provide the full model name now via config mapping
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True
    )
    
    async for chunk in response:
        yield f'data: {json.dumps({"event": "text-chunk", "data": {"text": chunk.choices[0].delta.content or ""}})}'
    
    yield "data: DONE"
    return
    
