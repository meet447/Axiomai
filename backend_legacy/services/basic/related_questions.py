from chat.llm import chat_with_model
import json
import re
import ast
from system.prompts import RELATED_QUESTION_PROMPT
from typing import List

async def generate_related_questions(prompt: str, query: str) -> List[str]:
    buffer = []

    async for chunk in chat_with_model(message=RELATED_QUESTION_PROMPT.format(context=prompt, query=query)):
        if chunk.strip() == "data: DONE":
            break
        try:
            data_obj = json.loads(chunk.removeprefix("data: ").strip())
            buffer.append(data_obj["data"]["text"])
        except Exception:
            continue

    full_text = ''.join(buffer).strip()

    # Clean output
    try:
        # Strip known prefixes and formatting
        if full_text.startswith("related_questions: "):
            full_text = full_text[len("related_questions: "):]
        full_text = re.sub(r"^```(?:json)?\s*|\s*```$", "", full_text)

        try:
            return json.loads(full_text)
        except json.JSONDecodeError:
            return ast.literal_eval(full_text)
    except Exception as e:
        print("Parse error in generate_related_questions:", e)
        return []