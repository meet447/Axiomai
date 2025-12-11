from chat.llm import chat_with_model
import json
import re
import ast
from system.prompts import QUERY_PLAN_PROMPT
from typing import List, Union


async def generate_plan(query: str, debug: bool = False) -> List[Union[str, dict]]:
    buffer = []

    async for chunk in chat_with_model(message=QUERY_PLAN_PROMPT.format(query=query)):
        if chunk.strip() == "data: DONE":
            break
        try:
            data_obj = json.loads(chunk.removeprefix("data: ").strip())
            buffer.append(data_obj["data"]["text"])
        except Exception:
            continue

    full_text = ''.join(buffer).strip()

    try:
        # Remove "query_plan: " if it exists
        if full_text.startswith("query_plan: "):
            full_text = full_text[len("query_plan: "):]

        # Remove ```json ... ```
        full_text = re.sub(r"^```(?:json)?\s*|\s*```$", "", full_text.strip())

        if debug:
            print("CLEANED:", full_text)

        # Try parsing
        try:
            parsed = json.loads(full_text)
        except json.JSONDecodeError:
            parsed = ast.literal_eval(full_text)

        if isinstance(parsed, list):
            return parsed
        else:
            if debug:
                print("Unexpected structure:", type(parsed))
            return []
    except Exception as e:
        if debug:
            print("Parse error:", e)
        return []