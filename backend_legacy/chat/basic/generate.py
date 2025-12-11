import asyncio
import json
from chat.llm import chat_with_model
from services.basic.search import search_duckduckgo
from services.basic.related_questions import generate_related_questions
from system.prompts import CHAT_PROMPT, HISTORY_QUERY_REPHRASE

async def stream_chunks(response_generator):
    """Stream model output chunks safely."""
    async for chunk in response_generator:
        if chunk.strip() == "data: DONE":
            break
        try:
            yield json.loads(chunk.removeprefix("data: "))
        except json.JSONDecodeError:
            continue
            
def format_context_for_llm(results: list) -> str:
    """
    Formats a list of search results into a structured string for the LLM context.
    """
    formatted_strings = []
    for i, result in enumerate(results, 1):
        formatted_strings.append(
            f"[{i}]\n"
            f"Title: {result.get('title', 'N/A')}\n"
            f"URL: {result.get('url', 'N/A')}\n"
            f"Summary: {result.get('content', 'N/A')}"
        )
    
    return "\n---\n".join(formatted_strings)

async def generate_response(query: str, history, model):
    yield f'data: {json.dumps({"event": "begin-stream", "data": {"event_type": "begin-stream", "query": query}})}\n\n'
    await asyncio.sleep(0)  # Flush immediately

    current_query = query

    # Rephrase query if there's history
    if history:
        rephrased = []
        async for json_chunk in stream_chunks(chat_with_model(
            message=HISTORY_QUERY_REPHRASE.format(
                question=current_query,
                chat_history=str(history),
            ),
            model=model
        )):
            rephrased.append(json_chunk.get("data", {}).get("text", ""))
        query = "".join(rephrased) or current_query

    # Search
    search_results = await search_duckduckgo(query)
    search_data = search_results.dict()
    
    yield f'data: {json.dumps({"event": "search-results", "data": {"event_type": "search-results", "results": search_data.get("results", []), "images": search_data.get("images", [])}})}\n\n'
    await asyncio.sleep(0)  # Flush immediately after sending search results

    # Chat model response using context
    final_response_parts = []
    async for json_chunk in stream_chunks(chat_with_model(
        message=CHAT_PROMPT.format(
            my_query=query,
            my_context=str(format_context_for_llm(search_data.get("results", [])))
        ),
        model=model
    )):
        text = json_chunk.get("data", {}).get("text", "")
        if text:
            final_response_parts.append(text)
            yield f'data: {json.dumps({"event": "text-chunk", "data": {"text": text}})}\n\n'
            await asyncio.sleep(0)  # Flush each text chunk immediately

    final_response = "".join(final_response_parts)

    # Final response event
    yield f'data: {json.dumps({"event": "final-response", "data": {"event_type": "final-response", "response": final_response}})}\n\n'
    await asyncio.sleep(0)  # Flush final response

    # Related questions
    related_questions = await generate_related_questions(prompt=final_response, query=query)
    yield f'data: {json.dumps({"event": "related-queries", "data": {"related_queries": related_questions}})}\n\n'
    await asyncio.sleep(0)  # Flush related questions

    # Final message
    yield f'data: {json.dumps({"event": "final-message", "data": {"message": final_response}})}\n\n'
    await asyncio.sleep(0)  # Flush final message

    # End of stream
    yield f'data: {json.dumps({"event": "stream-end", "data": {"thread_id": 125}})}\n\n'
    await asyncio.sleep(0)  # Flush end of stream