
import asyncio
import sys
import os

# Add the backend directory to sys.path to import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.research_service import perform_web_research

async def main():
    query = "What is the capital of France?"
    print(f"Testing research for: {query}")
    try:
        result = await perform_web_research(query)
        print("\n--- Result ---")
        print(result)
        print("\n--- End Result ---")
        
        if "**Deep Search Analysis**" in result or "**Deep Search Raw Data**" in result:
             print("\nSUCCESS: Deep Search triggered.")
        elif "DuckDuckGo Instant Answer API" in result:
             print("\nFAILURE: Instant Answer API still used.")
        else:
             print("\nWARNING: Unexpected output format.")

    except Exception as e:
        print(f"Error during research: {e}")

if __name__ == "__main__":
    asyncio.run(main())
