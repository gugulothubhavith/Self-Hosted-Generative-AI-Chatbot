import logging
import json
import asyncio
from app.services.llm_router import call_llm
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

async def run_orchestration(user_prompt: str, stream_callback=None) -> str:
    """
    Main Multi-Agent Loop:
    1. Planner: Breakdown task -> JSON Plan
    2. Coder: For each file -> Generate Code
    3. Reviewer: Check code -> Approve/Edit
    """
    logger.info(f"Starting Multi-Agent Orchestration for: {user_prompt[:50]}")
    
    # --- PHASE 1: PLANNER ---
    if stream_callback: await stream_callback("🧠 **Planner**: Analyzing requirements and creating a blueprint...")
    
    plan_prompt = (
        f"You are a Senior Software Architect. Analyze the following request: '{user_prompt}'.\n\n"
        "### Instructions:\n"
        "1. **Analyze Dependencies**: Carefully identify which modules depend on others to ensure a proper hierarchy.\n"
        "2. **Chain of Thought**: Think step-by-step about the architecture, components, and data flow required.\n"
        "3. **Detailed Plan**: Create a file list where each file has a clear purpose and listed dependencies.\n\n"
        "Return a JSON object (within ```json blocks) with this structure:\n"
        "{\n"
        "  \"thought_process\": \"Detailed architectural reasoning and dependency graph analysis...\",\n"
        "  \"files\": [\n"
        "    {\n"
        "      \"filename\": \"example.py\",\n"
        "      \"description\": \"Purpose and logic...\",\n"
        "      \"dependencies\": [\"other_file.py\"]\n"
        "    }\n"
        "  ],\n"
        "  \"summary\": \"Executive summary of the solution\"\n"
        "}"
    )
    
    planner_messages = [{"role": "user", "content": plan_prompt}]
    plan_resp = await call_llm("chat", {"model": "planner_agent", "messages": planner_messages, "temperature": 0.3}, key_group="agents")
    plan_text = plan_resp['choices'][0]['message']['content']
    
    # Parse JSON (naive cleanup)
    try:
        if "```json" in plan_text:
            plan_text = plan_text.split("```json")[1].split("```")[0]
        elif "```" in plan_text:
            plan_text = plan_text.split("```")[1].split("```")[0]
            
        plan_data = json.loads(plan_text.strip())
        logger.info(f"Plan created: {len(plan_data.get('files', []))} files.")
    except Exception as e:
        logger.error(f"Planner failed to produce valid JSON: {plan_text}")
        return f"❌ **Planner Error**: Could not generate a valid plan.\n\nRaw Output:\n{plan_text}"

    final_output = f"### 🏗️ Architect Plan\n\n**Architect's Reasoning & Dependencies:**\n{plan_data.get('thought_process', 'N/A')}\n\n**Summary:**\n{plan_data.get('summary', 'Plan generated.')}\n\n"
    
    # --- PHASE 2: PARALLEL PROCESSING (CODER & REVIEWER) ---
    async def process_file(file_info):
        filename = file_info['filename']
        desc = file_info['description']
        deps = file_info.get('dependencies', [])
        
        try:
            # Step A: Coder
            if stream_callback: await stream_callback(f"💻 **Coder**: Writing `{filename}`...")
            
            coder_prompt = (
                f"You are an Expert Developer. Write the complete code for the file `{filename}`.\n"
                f"Project Context: {plan_data.get('summary')}\n"
                f"Architectural Reasoning: {plan_data.get('thought_process')}\n"
                f"Requirements for this file: {desc}\n"
                f"Dependencies for this file: {', '.join(deps) if deps else 'None'}\n"
                "Return ONLY the code block. No explanations."
            )
            
            coder_messages = [{"role": "user", "content": coder_prompt}]
            # Parallel calls to the same model might hit rate limits, but HF Router often handles this.
            # Using agents key group for routing.
            code_resp = await call_llm("chat", {"model": "coder_agent", "messages": coder_messages, "temperature": 0.1}, key_group="agents")
            code_content = code_resp['choices'][0]['message']['content']
            
            # Step B: Reviewer
            if stream_callback: await stream_callback(f"🔍 **Reviewer**: Checking `{filename}` for bugs...")
            
            review_prompt = (
                f"Review the following code for `{filename}`. If it looks correct and secure, reply with 'APPROVED'. "
                "If there are major bugs, fix them and return the corrected code block.\n\n"
                f"Code:\n{code_content}"
            )
            
            review_messages = [{"role": "user", "content": review_prompt}]
            review_resp = await call_llm("chat", {"model": "reviewer_agent", "messages": review_messages, "temperature": 0.1}, key_group="agents")
            review_text = review_resp['choices'][0]['message']['content']
            
            if "APPROVED" in review_text:
                final_code = code_content
                status_icon = "✅"
            else:
                final_code = review_text 
                status_icon = "🛠️"
                
            return f"#### {status_icon} `{filename}`\n{final_code}\n"
        except Exception as e:
            logger.error(f"Error processing {filename}: {e}")
            return f"#### ❌ `{filename}`\nFailed to generate: {str(e)}\n"

    # Run all file processing tasks in parallel
    tasks = [process_file(f) for f in plan_data.get("files", [])]
    files_results = await asyncio.gather(*tasks)
    
    final_output += "\n".join(files_results)
    final_output += "\n\n---\n*Generated by Agent Squad: Parallel Processing Enabled*"
    
    return final_output
