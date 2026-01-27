import httpx
import asyncio
import json

async def test_api():
    query = "India"
    url = f"https://api.duckduckgo.com/?q={query}&format=json"
    print(f"Testing: {url}")
    
    async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/"}) as client:
        resp = await client.get(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            try:
                data = resp.json()
                print("--- API RESPONSE ---")
                print(f"Heading: {data.get('Heading')}")
                print(f"Abstract: {data.get('Abstract')}")
                print(f"Answer: {data.get('Answer')}")
                print(f"Type: {data.get('Type')}")
                print(f"RelatedTopics Count: {len(data.get('RelatedTopics', []))}")
                if data.get('RelatedTopics'):
                    print(f"First Related: {data['RelatedTopics'][0]}")
            except Exception as e:
                print(f"JSON Parse Error: {e}")
                print(resp.text[:500])

if __name__ == "__main__":
    asyncio.run(test_api())
