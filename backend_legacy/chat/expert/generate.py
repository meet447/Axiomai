import asyncio
import json
from chat.llm import chat_with_model
from services.basic.search import agent_search_duckduckgo
from services.expert.generate_questions import generate_related_queries
from services.basic.related_questions import generate_related_questions
from services.expert.generate_plan import generate_plan
from system.prompts import AGENT_QUERY_PROMPT, HISTORY_QUERY_REPHRASE

async def stream_chunks(response_generator):
    """Asynchronously streams and parses JSON chunks from the model."""
    async for chunk in response_generator:
        if chunk.strip() == "data: DONE":
            break
        try:
            yield json.loads(chunk.removeprefix("data: "))
        except Exception:
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

async def generate_response_expert(query: str, history: list):
    """
    Generates a comprehensive response using a multi-step agentic process.
    """
    yield f'data: {json.dumps({"event": "begin-stream", "data": {"event_type": "begin-stream", "query": query}})}\n\n'
    await asyncio.sleep(0)  # Flush immediately

    current_query = query

    # Rephrase query if history is present
    if history:
        chunks = []
        async for json_chunk in stream_chunks(chat_with_model(
            message=HISTORY_QUERY_REPHRASE.format(
                question=current_query,
                chat_history=str(history)
            )
        )):
            chunks.append(json_chunk.get("data", {}).get("text", ""))
        query = ''.join(chunks) or current_query

    # Step 1: Generate plan
    plan = await generate_plan(query)
    simplified_plan = [step["step"] for step in plan]
    yield f'data: {json.dumps({"event": "agent-query-plan", "data": {"steps": simplified_plan}})}\n\n'
    await asyncio.sleep(0)

    step_contexts = {}
    step_sources = {}
    step_images = {}

    last_step_id = plan[-1]["id"]

    # Step 2: Process intermediate steps
    for step in plan:
        step_id = step["id"]
        step_text = step["step"]

        if step_id == last_step_id:
            continue

        prev_contexts = [
            f"Step: {plan[dep_id]['step']}\nContext: {step_contexts[dep_id]}"
            for dep_id in step.get("dependencies", [])
            if dep_id in step_contexts
        ]
        prev_steps_context = "\n".join(prev_contexts)

        related_queries = await generate_related_queries(
            prev_steps_context=prev_steps_context.strip(),
            query=step_text,
            current_step=step_id
        )
        yield f'data: {json.dumps({"event": "agent-search-queries", "data": {"step_number": step_id, "queries": related_queries}})}\n\n'
        await asyncio.sleep(0)

        search_responses = await asyncio.gather(*(agent_search_duckduckgo(q) for q in related_queries))

        all_results = []
        all_sources = []
        all_images = []

        for resp in search_responses:
            resp_dict = resp.dict()
            all_results.extend(resp_dict.get("results", []))
            all_sources.extend(resp_dict.get("results", []))
            all_images.extend(resp_dict.get("images", []))

        # Store unique sources and images
        step_sources[step_id] = list({s['url']: s for s in all_sources}.values())
        step_images[step_id] = list(dict.fromkeys(all_images))
        
        # --- KEY CHANGE HERE ---
        # OLD LINE: step_contexts[step_id] = "\n".join(str(r) for r in all_results)
        # NEW LINE: Call the formatting function to structure the context correctly.
        step_contexts[step_id] = format_context_for_llm(all_results)
        # --- END OF CHANGE ---

        yield f'data: {json.dumps({"event": "agent-read-results", "data": {"step_number": step_id, "results": all_results}})}\n\n'
        await asyncio.sleep(0)

    # Step 3: Final synthesis step
    last_step = next(s for s in plan if s["id"] == last_step_id)
    dependencies = last_step.get("dependencies", [])

    # Combine contexts and sources from all necessary previous steps
    combined_contexts = [
        f"Step: {plan[dep_id]['step']}\nContext: {step_contexts[dep_id]}"
        for dep_id in dependencies if dep_id in step_contexts
    ]
    combined_sources = list({
        src["url"]: src
        for dep_id in dependencies
        for src in step_sources.get(dep_id, [])
    }.values())
    combined_images = list(dict.fromkeys([
        img
        for dep_id in dependencies
        for img in step_images.get(dep_id, [])
    ]))

    yield f'data: {json.dumps({"event": "search-results", "data": {"results": combined_sources, "images": combined_images}})}\n\n'
    await asyncio.sleep(0)
    
    # Format the final prompt with the structured context
    final_prompt = AGENT_QUERY_PROMPT.format(
        query=query,
        final_step=last_step["step"],
        context="\n\n".join(combined_contexts)
    )

    # Stream the final response from the LLM
    final_response_parts = []
    async for json_chunk in stream_chunks(chat_with_model(message=final_prompt)):
        text = json_chunk.get("data", {}).get("text", "")
        if text:
            final_response_parts.append(text)
            yield f'data: {json.dumps({"event": "text-chunk", "data": {"text": text}})}\n\n'
            await asyncio.sleep(0)

    final_response = "".join(final_response_parts)

    yield f'data: {json.dumps({"event": "final-response", "data": {"response": final_response}})}\n\n'
    await asyncio.sleep(0)

    # Generate related questions based on the final answer
    related_questions = await generate_related_questions(prompt=final_response, query=query)
    yield f'data: {json.dumps({"event": "related-queries", "data": {"related_queries": related_questions}})}\n\n'
    await asyncio.sleep(0)

    yield f'data: {json.dumps({"event": "stream-end", "data": {"thread_id": 125}})}\n\n'
    await asyncio.sleep(0)