import json
import re
import ast
from typing import List
from chat.llm import chat_with_model
from system.prompts import SEARCH_QUERY_PROMPT

def is_balanced_quotes(s: str) -> bool:
    # Count unescaped double quotes
    quotes = re.findall(r'(?<!\\)"', s)
    return len(quotes) % 2 == 0

def truncate_to_complete_list(s: str) -> str:
    # Find last closing bracket and truncate to it
    last_idx = s.rfind(']')
    if last_idx != -1:
        return s[:last_idx + 1]
    return s

async def generate_related_queries(
    prev_steps_context: str,
    query: str,
    current_step: str,
    debug: bool = False
) -> List[str]:
    buffer = []

    async for chunk in chat_with_model(
        message=SEARCH_QUERY_PROMPT.format(
            user_query=query,
            prev_steps_context=prev_steps_context,
            current_step=current_step
        )
    ):
        if chunk.strip() == "data: DONE":
            break
        try:
            data_obj = json.loads(chunk.removeprefix("data: ").strip())
            buffer.append(data_obj["data"]["text"])
        except Exception:
            continue

    full_text = ''.join(buffer).strip()

    if debug:
        print("Raw model output:", repr(full_text))

    try:
        if full_text.startswith("related_questions: "):
            full_text = full_text[len("related_questions: "):]

        # Remove markdown code fences
        full_text = re.sub(r"^```(?:json)?\s*|\s*```$", "", full_text).strip()

        if debug:
            print("Cleaned model output:", repr(full_text))

        try:
            # Try normal JSON parse first
            parsed = json.loads(full_text)
        except json.JSONDecodeError as e_json:
            if debug:
                print(f"JSON decode error: {e_json}")

            # Fix trailing commas in lists/dicts
            fixed_text = re.sub(r",(\s*[\]\}])", r"\1", full_text)

            # Truncate to last complete list to avoid incomplete input
            fixed_text = truncate_to_complete_list(fixed_text)

            # Only try literal_eval if quotes are balanced
            if not is_balanced_quotes(fixed_text):
                if debug:
                    print("Unbalanced quotes detected, skipping literal_eval")
                return []

            if debug:
                print("Fixed text for literal_eval:", repr(fixed_text))

            try:
                parsed = ast.literal_eval(fixed_text)
            except Exception as e_ast:
                if debug:
                    print(f"ast.literal_eval error: {e_ast}")
                return []

        # Confirm parsed result is list of strings
        if isinstance(parsed, list) and all(isinstance(q, str) for q in parsed):
            return parsed
        else:
            if debug:
                print("Parsed output is not a list of strings:", parsed)
            return []
    except Exception as e:
        if debug:
            print("Unexpected parse error:", e)
        return []