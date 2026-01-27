from app.schemas.chat import ChatRequest, ChatResponse
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.services.llm_router import call_llm
from app.services.rag_service import query_rag
from app.services.research_service import perform_web_research
from app.services.memory_service import get_relevant_memories, extract_and_store_memories
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
import logging
import json
from datetime import datetime

from app.core.redis_client import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)

SESSION_TTL = 86400  # 24 hours

async def generate_title(content: str) -> str:
    """Generate a concise title for a new chat session."""
    prompt = f"Generate a very concise title (max 6 words) for a chat that starts with this message: '{content}'. Return ONLY the title text."
    try:
        resp = await call_llm("chat", {"model": settings.GROQ_MODEL, "messages": [{"role": "user", "content": prompt}]})
        title = resp['choices'][0]['message']['content'].strip(' "')
        return title[:100]
    except:
        return content[:50] + "..."

async def process_chat(payload: ChatRequest, user: User, db: Session, background_tasks: BackgroundTasks = None, stream: bool = False):
    logger.info(f"Process Chat Start: user={user.email}, session={payload.conversation_id}, model={payload.model}")
    from app.services.privacy_service import scrub_text
    
    # Pre-process: PII Scrubbing
    if payload.messages:
        last_msg = payload.messages[-1]
        last_msg.content = scrub_text(last_msg.content)

    session_id = payload.conversation_id
    
    # 1. Ensure Session exists
    if not session_id:
        # Create new session if none provided
        session = ChatSession(user_id=user.id, workspace=payload.workspace or "personal")
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id
    else:
        session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user.id).first()
        if not session:
            raise Exception("Unauthorized or invalid session")

    # 2. Save User Message
    last_msg = payload.messages[-1]
    db_user_msg = ChatMessage(session_id=session_id, role="user", content=last_msg.content, image_url=last_msg.image)
    db.add(db_user_msg)
    
    # 3. Auto-Title if needed
    message_count = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).count()
    if message_count <= 1:
        session.title = await generate_title(last_msg.content)
    
    db.commit()

    # --- REDIS SESSION TRACKING (Sync user message) ---
    try:
        redis_key = f"session:history:{session_id}"
        msg_json = json.dumps({"role": "user", "content": last_msg.content})
        redis_client.rpush(redis_key, msg_json)
        redis_client.expire(redis_key, SESSION_TTL)
    except Exception as e:
        logger.warning(f"Failed to push user message to Redis: {e}")

    # 4. Handle Web Search
    if payload.web_search:
        logger.info(f"Web Search requested for: {last_msg.content}")
        try:
            research_result = await perform_web_research(last_msg.content)
        except Exception as e:
            logger.error(f"Web Research Crash: {e}", exc_info=True)
            research_result = f"Click the research button again. (System Error: {str(e)})"

        # Save research result as assistant message
        db_assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=research_result)
        db.add(db_assistant_msg)
        db.commit()
        
        if stream:
            async def research_gen():
                # Yield the entire result as one chunk (or split if needed, but one is fine for text)
                yield research_result
            return research_gen(), session_id
            
        return ChatResponse(role="assistant", content=research_result), session_id

    # 5. Build full context for LLM (Redis first, DB fallback)
    messages = []
    redis_key = f"session:history:{session_id}"
    
    try:
        cached_history = redis_client.lrange(redis_key, 0, -1)
        if cached_history:
            logger.info(f"Chat Session Cache Hit: {redis_key}")
            messages = [json.loads(m) for m in cached_history]
        else:
            logger.info(f"Chat Session Cache Miss: {redis_key}")
            # Load from DB
            history_query = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.desc())
            if payload.history_limit:
                history_query = history_query.limit(payload.history_limit)
            
            history = history_query.all()
            history.reverse()
            
            for h in history:
                messages.append({"role": h.role, "content": h.content})
            
            # Populate Redis for next time
            if messages:
                redis_client.delete(redis_key)
                redis_client.rpush(redis_key, *[json.dumps(m) for m in messages])
                redis_client.expire(redis_key, SESSION_TTL)
    except Exception as e:
        logger.warning(f"Fast session tracking failed: {e}. Falling back to standard DB retrieval.")
        # Re-run standard DB retrieval if Redis completely fails
        history_query = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.desc())
        if payload.history_limit:
            history_query = history_query.limit(payload.history_limit)
        history = history_query.all()
        history.reverse()
        messages = [{"role": h.role, "content": h.content} for h in history]
    
    # 6. RAG Integration
    try:
        if payload.use_rag:
            query = last_msg.content
            logger.info(f"Querying RAG for: {query[:50]}...")
            context = query_rag(query)
            if context:
                rag_instructions = (
                    "You are an AI assistant with access to a knowledge base. "
                    "Below is the relevant context retrieved from uploaded documents. "
                    "Use ONLY this context to answer the user's question as accurately and comprehensively as possible. "
                    "If the answer is not contained within the provided context, state that you do not have enough information from the documents to answer, but you can answer based on your general knowledge if appropriate (clearly distinguishing between the two). "
                    "Important: Always cite your sources by mentioning the [Source: filename] provided in the context for each piece of information used.\n\n"
                    f"--- CONTEXT START ---\n{context}\n--- CONTEXT END ---\n\n"
                    f"User Question: {query}"
                )
                messages[-1]["content"] = rag_instructions
    except Exception as e:
        logger.warning(f"RAG Lookup failed: {e}")

    # 7. Memory & System Prompt Injection
    system_messages = []
    
    # User Custom System Prompt
    if payload.system_prompt:
        system_messages.append(f"Custom Instruction:\n{payload.system_prompt}")

    try:
        memories = get_relevant_memories(user.id)
        if memories:
            system_messages.append(f"System Memory (Authoritative):\n{memories}")
    except Exception as e:
         logger.warning(f"Memory lookup failed: {e}")

    if system_messages:
        messages.insert(0, {"role": "system", "content": "\n\n".join(system_messages)})

    # 8.Vision Handling
    if last_msg.image:
        llm_model = "vision_model"
        vision_content = [
            {"type": "text", "text": last_msg.content or "Describe this image"},
            {"type": "image_url", "image_url": {"url": last_msg.image}} 
        ]
        messages[-1]["content"] = vision_content
        key_group = "vision"
    else:
        llm_model = payload.model or "chat"
        key_group = "rag"

    llm_payload = {
        "messages": messages,
        "model": llm_model,
        "stream": stream,
        "temperature": payload.temperature if payload.temperature is not None else 0.7,
        "max_tokens": payload.max_tokens if payload.max_tokens is not None else 2048,
        "top_p": payload.top_p if payload.top_p is not None else 1.0,
        "frequency_penalty": payload.frequency_penalty if payload.frequency_penalty is not None else 0.0,
        "presence_penalty": payload.presence_penalty if payload.presence_penalty is not None else 0.0,
    }

    if stream:
        async def stream_wrapper():
            try:
                logger.info(f"Stream Wrapper starting for model: {llm_model}")
                full_content = ""
                # call_llm returns an async generator for stream=True
                generator = await call_llm("chat", llm_payload, key_group=key_group, stream=True)
                logger.info(f"call_llm returned generator of type: {type(generator)}")
                async for chunk in generator:
                     full_content += chunk
                     yield chunk
                
                # Once stream ends, save to DB
                db_assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=full_content)
                db.add(db_assistant_msg)
                db.commit()
                if background_tasks:
                     background_tasks.add_task(extract_and_store_memories, user.id, last_msg.content, full_content)
                
                # Save Assistant Message to Redis
                try:
                    redis_key = f"session:history:{session_id}"
                    redis_client.rpush(redis_key, json.dumps({"role": "assistant", "content": full_content}))
                    redis_client.expire(redis_key, SESSION_TTL)
                except Exception as e:
                    logger.warning(f"Failed to push assistant message to Redis: {e}")
            except Exception as e:
                logger.error(f"Stream Wrapper Critical Failure: {e}")
                yield f"\n\n❌ **[System Error]**: {str(e)}"
                
        return stream_wrapper(), session_id

    # Non-streaming
    response_data = await call_llm("chat", llm_payload, key_group=key_group)
    content = response_data.get('choices', [])[0].get('message', {}).get('content', "No content")
    
    # Save Assistant Message
    db_assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=content)
    db.add(db_assistant_msg)
    db.commit()

    if background_tasks:
         background_tasks.add_task(extract_and_store_memories, user.id, last_msg.content, content)

    # Save Assistant Message to Redis
    try:
        redis_key = f"session:history:{session_id}"
        redis_client.rpush(redis_key, json.dumps({"role": "assistant", "content": content}))
        redis_client.expire(redis_key, SESSION_TTL)
    except Exception as e:
        logger.warning(f"Failed to push assistant message to Redis: {e}")

    return ChatResponse(role="assistant", content=content), session_id

def delete_user_chat_history(user_id: str, db: Session):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).all()
    for session in sessions:
        db.delete(session)
    db.commit()

def export_user_chat_history(user_id: str, db: Session):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).all()
    export_data = []
    for session in sessions:
        messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at.asc()).all()
        session_data = {
            "id": str(session.id),
            "title": session.title,
            "created_at": session.created_at.isoformat(),
            "messages": [
                {
                    "role": msg.role, 
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat()
                } for msg in messages
            ]
        }
        export_data.append(session_data)
    
    return {"sessions": export_data, "generated_at": datetime.utcnow().isoformat()}