import logging
import httpx
import asyncio

from app.services.llm_router import call_llm

logger = logging.getLogger(__name__)

from duckduckgo_search import DDGS
from bs4 import BeautifulSoup

async def perform_web_research(query: str) -> str:
    """
    Research:
    Always perform Deep Search (DDGS + Scrape + LLM) for thorough results.
    """
    logger.info(f"Deep Research Start for: {query}")
    return await perform_fallback_search(query)

async def perform_fallback_search(query: str) -> str:
    """Fallback mechanism using DDGS + Scraping + LLM Summarization"""
    try:
        results = []
        
        # 1. Search (Text -> HTML -> News)
        # Browser headers for HTTPX (Scraping), NOT for DDGS (it handles its own)
        headers = {
           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
           "Referer": "https://duckduckgo.com/"
        }
        
        # DDGS v6+ does not accept headers in __init__
        try:
            with DDGS() as ddgs:
                 # Try HTML backend (Robust)
                 results = list(ddgs.text(query, max_results=3, backend="html"))
                 
                 # Fallback to News
                 if not results:
                     logger.info("Deep Search: Checking News...")
                     results = list(ddgs.news(query, max_results=3))
        except TypeError:
             # Fallback for older versions just in case
             with DDGS(headers=headers) as ddgs:
                 results = list(ddgs.text(query, max_results=3, backend="html"))

        if not results:
            return "I checked everywhere but found no results for this query."

        # 2. Scrape
        scraped_data = []
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers, verify=False) as client:
            for r in results:
                url = r.get('href') or r.get('url') # News uses 'url', Text uses 'href'
                title = r.get('title', 'No Title')
                
                if not url: continue
                
                try:
                    if url.endswith(('.pdf', '.png', '.jpg')): continue
                    
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        soup = BeautifulSoup(resp.text, 'html.parser')
                        for tag in soup(["script", "style", "nav", "footer", "header", "meta"]): tag.extract()
                        text = soup.get_text(separator=' ', strip=True)
                        clean_text = " ".join([line for line in text.split('\n') if len(line.strip()) > 30])[:2500]
                        scraped_data.append(f"SOURCE: [{title}]({url})\nCONTENT: {clean_text}\n")
                except:
                    pass

        # 3. Summarize with LLM
        if not scraped_data:
             links = "\n".join([f"- [{r.get('title')}]({r.get('href') or r.get('url')})" for r in results])
             return f"Found links but couldn't read content:\n{links}"

        context = "\n---\n".join(scraped_data)
        prompt = f"Answer this question using ONLY the provided context. Cite sources.\n\nQuestion: {query}\n\nContext:\n{context}"
        
        try:
            # Use fast model for summarization
            payload = {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": prompt}]}
            response = await call_llm("chat", payload)
            content = response['choices'][0]['message']['content']
            
            return f"**Deep Search Analysis**:\n\n{content}\n\n**Sources**:\nDuckDuckGo Web Search"
        except Exception as e:
            return f"**Deep Search Raw Data**:\n\n{context[:2000]}..."
    except Exception as e:
        logger.error(f"Deep Search Critical Failure: {e}")
        return f"Deep Search failed: {str(e)}"

