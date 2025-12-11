import asyncio
import re
from typing import List
from bs4 import BeautifulSoup
from curl_cffi import AsyncSession
from ddgs import DDGS

from models.schemas import SearchResult, SearchResponse


def extract_text_from_html(html_content: str, max_length: int = 4000) -> str:
    soup = BeautifulSoup(html_content, "html.parser")
    for tag in soup(["script", "style", "noscript", "header", "footer", "nav", "meta"]):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True)
    text = re.sub(r'\s+', ' ', text)
    return text[:max_length]


async def fetch_and_process_url(client: AsyncSession, url: str) -> str:
    if not url:
        return ""
    try:
        response = await client.get(url, timeout=6, impersonate="chrome116")
        response.raise_for_status()
        return extract_text_from_html(response.text)
    except Exception:
        return ""


async def perform_ddg_search(
    query: str,
    max_text_results: int,
    max_image_results: int
) -> SearchResponse:
    ddgs = DDGS()

    # TEXT RESULTS
    text_results_raw = ddgs.text(query=query)
    selected_text = list(text_results_raw)[:max_text_results]

    titles = [item.get("title", "") for item in selected_text]
    urls = [item.get("href", "") for item in selected_text]
    base_contents = [item.get("content", "") for item in selected_text]

    async with AsyncSession() as client:
        extra_contents = await asyncio.gather(*(fetch_and_process_url(client, url) for url in urls))

    text_results: List[SearchResult] = []
    for i in range(len(titles)):
        content = base_contents[i]
        if extra_contents[i]:
            content += "\n\n" + extra_contents[i]
        text_results.append(SearchResult(title=titles[i], url=urls[i], content=content))

    # IMAGE RESULTS
    image_results_raw = ddgs.images(query=query)
    images = [img.get("image") for img in list(image_results_raw)[:max_image_results] if img.get("image")]

    return SearchResponse(results=text_results, images=images)


# Full search with more results
async def search_duckduckgo(query: str) -> SearchResponse:
    return await perform_ddg_search(query, max_text_results=7, max_image_results=6)


# Agent-specific lighter search
async def agent_search_duckduckgo(query: str) -> SearchResponse:
    return await perform_ddg_search(query, max_text_results=4, max_image_results=2)