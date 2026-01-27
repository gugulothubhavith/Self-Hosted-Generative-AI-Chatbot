from duckduckgo_search import DDGS
import httpx
import asyncio
from bs4 import BeautifulSoup

async def test_search_and_scrape():
    print("Testing Search & Scrape...")
    query = "weather in khammam"
    
    # 1. Search
    results = []
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
            print(f"✅ Found {len(results)} search results.")
    except Exception as e:
        print(f"❌ Search failed: {e}")
        return

    if not results:
        print("⚠️ No results to scrape.")
        return

    # 2. Scrape
    print("\nAttempting to scrape top result...")
    url = results[0]['href']
    print(f"URL: {url}")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
            resp = await client.get(url)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                text = soup.get_text(separator=' ', strip=True)[:500]
                print(f"✅ Scraped Content (preview): {text}...")
            else:
                print("❌ Failed to load page.")
    except Exception as e:
        print(f"❌ Scraping exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_search_and_scrape())
