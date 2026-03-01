<p align="center">
  <img src="cover.png" width="100%" alt="InfiChat — Self-Hosted Generative AI Platform">
</p>

<p align="center">
  <img src="frontend/public/app_name.png" height="60" alt="InfiChat Logo">
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.python.org/downloads/release/python-3110/"><img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" alt="Python 3.11"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker Ready"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
  <img src="https://img.shields.io/badge/Version-2.0.0-10A37F.svg" alt="Version 2.0.0">
  <img src="https://img.shields.io/badge/Status-Production--Ready-brightgreen" alt="Production Ready">
</p>

<p align="center">
  <strong>Your Private, Sovereign AI Platform — No Cloud. No Compromise. No Data Leaks.</strong>
</p>

<p align="center">
  A production-grade, fully self-hosted generative AI chatbot featuring real-time streaming chat, professional Indic TTS/STT, Retrieval-Augmented Generation (RAG), sandboxed Python code execution, and enterprise-level authentication — all running on your own hardware.
</p>

---

## 📑 Table of Contents

- [🛡️ Our Mission](#️-our-mission)
- [✨ Feature Highlights](#-feature-highlights)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Technology Stack](#️-technology-stack)
- [📋 Prerequisites](#-prerequisites)
- [⚡ Quick Start](#-quick-start-windows)
- [🔧 Manual Setup](#-manual-setup)
- [🗝️ API Keys & Configuration](#️-api-keys--configuration)
- [📁 Project Structure](#-project-structure)
- [📡 API Reference](#-api-reference)
- [🔐 Security Model](#-security-model)
- [🚀 Deployment](#-deployment)
- [🎙️ Voice System Deep Dive](#️-voice-system-deep-dive)
- [📚 RAG System Deep Dive](#-rag-system-deep-dive)
- [🤖 Code Agent Deep Dive](#-code-agent-deep-dive)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## 🛡️ Our Mission

In an era of centralized AI monopolies, **InfiChat** was built on a single principle: **your intelligence should be sovereign**.

Every major AI provider today collects your conversations, trains on your data, and stores your proprietary information on third-party servers. InfiChat changes that equation entirely.

| Feature                             | Cloud AI (ChatGPT, etc.) | **InfiChat** |
| :---------------------------------- | :----------------------: | :----------: |
| Your data stays on your device      |            ❌            |      ✅      |
| Works fully offline                 |            ❌            |      ✅      |
| No third-party telemetry            |            ❌            |      ✅      |
| Customizable & self-hostable        |            ❌            |      ✅      |
| Enterprise data residency compliant |            ❌            |      ✅      |
| Open Source                         |            ❌            |      ✅      |

> **InfiChat is designed for developers, enterprises, researchers, and privacy-conscious individuals who refuse to compromise on data sovereignty.**

---

## ✨ Feature Highlights

### 💬 Multi-Provider Streaming Chat

InfiChat's **Smart Router** dynamically routes requests to the optimal LLM provider based on task type, enabling cost-efficient, high-performance conversations.

| Provider          | Model                   |     Speed      | Use Case                      |
| :---------------- | :---------------------- | :------------: | :---------------------------- |
| **Groq**          | Llama 3.3 70B           |   ~300 tok/s   | General chat, summarization   |
| **Google Gemini** | Flash 2.0               |   Ultra-fast   | Vision, multimodal, long docs |
| **OpenRouter**    | DeepSeek V3, Claude 3.5 |     Varies     | Specialized tasks, coding     |
| **Ollama**        | Any GGUF model          | Hardware-bound | Fully offline / air-gapped    |

- Real-time **Server-Sent Events (SSE)** streaming with token-by-token output
- Persistent multi-turn conversation history with session archiving
- Shareable conversation links with access-controlled public URLs
- **PII scrubbing** — automatically redacts personally identifiable information before logging

---

### 🎙️ Professional Indic TTS / STT

InfiChat features a best-in-class voice pipeline tailored for multilingual Indian users, powered by **Microsoft Edge-TTS** and **Faster Whisper**.

#### Text-to-Speech (TTS) Voice Profiles

| Profile                     | Locale  | Voice           | Character                        |
| :-------------------------- | :------ | :-------------- | :------------------------------- |
| 🔊 **Professional English** | `en-IN` | `PrabhatNeural` | Authoritative, broadcast-quality |
| 🔊 **Corporate Hindi**      | `hi-IN` | `SwaraNeural`   | Warm, professional female        |
| 🔊 **Empathetic Telugu**    | `te-IN` | `MohanNeural`   | Calm, reassuring male            |
| 🔊 **Alert Hindi (Fast)**   | `hi-IN` | Swara @+25%     | Rapid, notification-style        |

**Key Capabilities:**

- **Sub-1-second audio latency** — MP3 streaming starts before synthesis completes
- **Native Indian number formatting** — Correctly reads ₹ Lakhs, Crores, and common abbreviations
- **Voice interruption** — User can stop playback mid-sentence
- **Streaming audio chunks** — Progressive delivery over WebSocket

#### Speech-to-Text (STT)

- Powered by **Faster Whisper** (local CTranslate2 inference — no cloud API)
- Works **fully offline** — voice data never leaves your machine
- Supports multilingual transcription across Indian and global languages
- Real-time waveform visualization in the UI

---

### 📚 RAG — Retrieval-Augmented Generation

Transform your static documents into an interactive, AI-powered knowledge base.

**How it works:**

1. Upload **PDF**, **DOCX**, or **TXT** files through the Knowledge Base panel
2. Documents are parsed, chunked, and embedded using `sentence-transformers`
3. Chunks are indexed in **ChromaDB** (local vector store)
4. On each query, semantically relevant chunks are retrieved and injected into the LLM prompt
5. The model responds with citations grounded in your documents

**Technical specs:**

- Embedding model: `all-MiniLM-L6-v2` (runs locally, ~80MB)
- Chunking strategy: Recursive character-aware with 512-token overlap windows
- Retrieval: Cosine similarity with top-k = 5 context injection
- Supports multi-document knowledge bases per user

---

### 🤖 Sandboxed Python Code Agent

The AI can write, execute, and iterate on Python code — safely.

- **Hardened Docker container** — zero host system access
- **Real-time output streaming** via WebSocket — watch code execute live
- **Auto-debugging loop** — the agent reads runtime errors and self-corrects
- **Package sandbox** — only whitelisted libraries available inside the container
- Supports data analysis, visualization (matplotlib), file I/O, and algorithm design
- Each session runs in an **ephemeral container** — no state persists between runs

---

### 🔐 Authentication & Account Management

Enterprise-grade identity and access management:

- **Email + OTP** two-factor authentication (TOTP-compatible)
- **Google OAuth 2.0** single sign-on — one-click login
- **JWT-based sessions** with configurable expiry and refresh tokens
- Bcrypt password hashing (`passlib[bcrypt]`)
- **Rate limiting** via `slowapi` — prevents brute-force and abuse
- Account settings: password reset, profile management, session history
- Shared chat link generation with expiry controls

---

### 🖼️ Image Generation

- AI-powered image generation via **Pollinations API** or a locally hosted **Stable Diffusion XL**
- Prompt-to-image directly within the chat interface
- Gallery view for generated images with download support

---

## 🏗️ System Architecture

```mermaid
graph TD
    User["👤 User (Browser)"]

    subgraph "Frontend Layer"
        UI["React 18 + TypeScript + Vite\n(Port 5173)"]
    end

    subgraph "API Gateway"
        API["FastAPI Backend\n(Uvicorn • Port 8000)"]
        RL["SlowAPI Rate Limiter"]
        JWT["JWT Auth Middleware"]
    end

    subgraph "AI Orchestration Layer"
        Router{"🧠 Smart Router"}
        LLM["☁️ LLM Providers\n(Groq / Gemini / OpenRouter)"]
        Ollama["🖥️ Ollama\n(Local / Offline)"]
        TTS["🎙️ Edge-TTS\n(Indic Voices)"]
        STT["🗣️ Faster Whisper\n(Local STT)"]
        RAG["📚 ChromaDB RAG\n(Semantic Search)"]
        Sandbox["🐳 Code Sandbox\n(Isolated Docker)"]
        ImgGen["🖼️ Image Generation\n(SDXL / Pollinations)"]
    end

    subgraph "Persistent Storage"
        PG[("🐘 PostgreSQL\n(User Data, Sessions)")]
        VDB[("🔵 ChromaDB\n(Vector Embeddings)")]
        Cache[("⚡ Redis\n(Sessions, Cache)")]
        Files["📁 File Storage\n(Uploads, Audio)"]
    end

    subgraph "Auth Providers"
        Google["🔵 Google OAuth 2.0"]
        OTP["📧 Email OTP"]
    end

    User --> UI
    UI <-->|"HTTP / SSE / WebSocket"| API
    API --> RL --> JWT
    JWT --> Router
    Router --> LLM
    Router --> Ollama
    Router --> TTS
    Router --> STT
    Router --> RAG
    Router --> Sandbox
    Router --> ImgGen
    API --> PG
    API --> VDB
    API --> Cache
    API --> Files
    API --> Google
    API --> OTP
```

### Data Flow for a Chat Request

```
User types message
       │
       ▼
React UI sends POST /api/chat with JWT token
       │
       ▼
FastAPI validates token → applies rate limit → routes to Smart Router
       │
       ├─── RAG enabled? → ChromaDB similarity search → inject context
       │
       ├─── Code task? → Dispatch to Docker Sandbox → stream stdout/stderr
       │
       └─── Standard chat? → Stream SSE tokens from Groq/Gemini/OpenRouter
                                         │
                                         ▼
                              React renders tokens in real-time
                                         │
                                         ▼
                              PostgreSQL persists conversation
```

---

## 🛠️ Technology Stack

### Frontend

| Technology   | Version | Role                                       |
| :----------- | :------ | :----------------------------------------- |
| React        | 18      | UI framework with hooks-based architecture |
| TypeScript   | 5.x     | Type-safe component development            |
| Vite         | 5.x     | Lightning-fast HMR dev server & bundler    |
| Vanilla CSS  | —       | Custom design system, no heavy frameworks  |
| Lucide React | Latest  | Consistent icon library                    |

### Backend

| Technology     | Version | Role                                    |
| :------------- | :------ | :-------------------------------------- |
| FastAPI        | 0.109.2 | Async REST API + WebSocket server       |
| Uvicorn        | 0.27.1  | ASGI server with lifespan management    |
| Pydantic       | 2.6.1   | Data validation and settings management |
| SQLAlchemy     | 2.0.25  | Async ORM with connection pooling       |
| Alembic        | 1.13.1  | Database migrations                     |
| python-jose    | 3.3.0   | JWT token generation and validation     |
| passlib/bcrypt | 1.7.4   | Secure password hashing                 |
| SlowAPI        | 0.1.9   | Request rate limiting                   |

### AI & ML

| Technology                   | Role                               |
| :--------------------------- | :--------------------------------- |
| Groq SDK                     | Ultra-fast Llama 3.3 70B inference |
| Google Generative AI         | Gemini Flash 2.0 multimodal        |
| OpenRouter                   | Gateway to 100+ LLM models         |
| Ollama                       | Local model runner (GGUF)          |
| ChromaDB ≥0.4.22             | Local vector database for RAG      |
| sentence-transformers ≥2.2.2 | Document embedding model           |
| faster-whisper ≥0.10.0       | CTranslate2-based local STT        |
| edge-tts ≥6.1.9              | Microsoft Neural Indic TTS         |
| pypdf ≥4.0.0                 | PDF document parsing               |
| python-docx ≥1.1.0           | DOCX document parsing              |
| tiktoken ≥0.6.0              | Accurate token counting            |
| Pillow ≥10.0.0               | Image processing                   |

### Infrastructure

| Technology    | Role                                       |
| :------------ | :----------------------------------------- |
| PostgreSQL 16 | Primary relational database                |
| Redis 7       | Session caching, pub/sub                   |
| Docker        | Container runtime + code sandbox isolation |
| asyncpg       | High-performance async PostgreSQL driver   |

---

## 📋 Prerequisites

Before installing InfiChat, ensure your system meets the following requirements:

### System Requirements

| Component   |      Minimum       |            Recommended            |
| :---------- | :----------------: | :-------------------------------: |
| **CPU**     |      4 cores       |             8+ cores              |
| **RAM**     |        8 GB        |              16 GB+               |
| **Storage** |       20 GB        |              50 GB+               |
| **OS**      | Windows 10 / Linux |    Windows 11 / Ubuntu 22.04+     |
| **GPU**     |    Not required    | NVIDIA RTX (for Ollama + Whisper) |

### Required Software

- **Python** 3.11+ → [python.org](https://www.python.org/downloads/)
- **Node.js** 20+ → [nodejs.org](https://nodejs.org)
- **Docker Desktop** → [docker.com](https://www.docker.com/products/docker-desktop/)
- **Git** → [git-scm.com](https://git-scm.com)
- **Ollama** (optional, for offline models) → [ollama.com](https://ollama.com)

---

## ⚡ Quick Start (Windows)

The fastest way to get InfiChat running — one script does everything.

```powershell
# 1. Clone the repository
git clone https://github.com/gugulothubhavith/Self-Hosted-Generative-AI-Chatbot.git
cd Self-Hosted-Generative-AI-Chatbot

# 2. Run the automated setup script
.\setup_windows.ps1
```

**The `setup_windows.ps1` script automatically:**

1. ✅ Verifies Docker Desktop and Python 3.11+ are installed
2. ✅ Prompts for API keys and writes your `.env` file
3. ✅ Creates a Python virtual environment and installs all dependencies
4. ✅ Initializes the PostgreSQL database schema
5. ✅ Builds and launches all services
6. ✅ Opens the application at **`http://localhost:5173`**

> **Tip:** On first run, Docker will pull required images (~2–3 GB). This is a one-time operation.

---

## 🔧 Manual Setup

For advanced users or Linux/macOS deployments:

### Step 1: Clone & Configure

```bash
git clone https://github.com/gugulothubhavith/Self-Hosted-Generative-AI-Chatbot.git
cd Self-Hosted-Generative-AI-Chatbot

# Copy environment template
cp .env.example .env
# Edit .env with your API keys (see configuration section below)
```

### Step 2: Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # Linux/macOS

# Install all Python dependencies
pip install -r requirements.txt

# Initialize the database (ensure PostgreSQL is running)
python fix_db_schema.py
```

### Step 3: Frontend Setup

```bash
cd frontend

# Install Node.js dependencies
npm install
```

### Step 4: Start Services

**Option A — Using the batch launcher:**

```batch
.\start_all.bat
```

**Option B — Manually (3 terminals):**

```bash
# Terminal 1: Start the FastAPI backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start the React frontend
cd frontend
npm run dev

# Terminal 3 (optional): Install frontend dependencies first
cd frontend
npm install dependencies.bat
```

**Option C — Docker Compose:**

```bash
docker compose up --build
```

### Step 5: Access the Application

| Service              | URL                         |
| :------------------- | :-------------------------- |
| **Frontend UI**      | http://localhost:5173       |
| **Backend API**      | http://localhost:8000       |
| **Swagger API Docs** | http://localhost:8000/docs  |
| **ReDoc API Docs**   | http://localhost:8000/redoc |

---

## 🗝️ API Keys & Configuration

### Required API Keys

| Provider             | Purpose                            | Free Tier | Link                                               |
| :------------------- | :--------------------------------- | :-------: | :------------------------------------------------- |
| **Groq**             | Llama 3.3 70B — primary fast chat  |  ✅ Yes   | [console.groq.com](https://console.groq.com)       |
| **Google AI Studio** | Gemini Flash — vision & multimodal |  ✅ Yes   | [aistudio.google.com](https://aistudio.google.com) |
| **OpenRouter**       | DeepSeek, Claude, 100+ models      |  ✅ Yes   | [openrouter.ai](https://openrouter.ai)             |

### Optional Configuration

| Provider         | Purpose                   | Link                                                         |
| :--------------- | :------------------------ | :----------------------------------------------------------- |
| **Ollama**       | 100% offline local models | [ollama.com](https://ollama.com)                             |
| **Google OAuth** | Google SSO login          | [console.cloud.google.com](https://console.cloud.google.com) |

### Full `.env` Configuration Reference

```ini
# ─────────────────────────────────────────────────────
#  LLM API Keys
# ─────────────────────────────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────────────
#  Database Configuration
# ─────────────────────────────────────────────────────
DATABASE_URL=postgresql://ai:ai_pass@localhost:5432/autoagent
REDIS_URL=redis://localhost:6379/0

# ─────────────────────────────────────────────────────
#  Authentication & Security
# ─────────────────────────────────────────────────────
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-256-bit-random-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# ─────────────────────────────────────────────────────
#  Google OAuth 2.0 (Optional)
# ─────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/oauth/google/callback

# ─────────────────────────────────────────────────────
#  Ollama (Optional — for offline local models)
# ─────────────────────────────────────────────────────
OLLAMA_BASE_URL=http://localhost:11434

# ─────────────────────────────────────────────────────
#  Feature Flags
# ─────────────────────────────────────────────────────
ENABLE_PII_SCRUBBING=true
ENABLE_RATE_LIMITING=true
ENABLE_CODE_SANDBOX=true
MAX_UPLOAD_SIZE_MB=50

# ─────────────────────────────────────────────────────
#  Application Settings
# ─────────────────────────────────────────────────────
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173
```

---

## 📁 Project Structure

```
Self-Hosted-Generative-AI-Chatbot/
│
├── 📄 README.md                    # This file
├── 📄 .env.example                 # Environment template
├── 📄 setup_windows.ps1            # One-click Windows setup
├── 📄 start_all.bat                # Launch all services
├── 📄 install_dependencies.bat     # Dependency installer
│
├── 🖼️  cover.png                   # Project cover image
│
├── 🐍 backend/                     # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                 # Application entrypoint, lifespan, CORS
│   │   ├── api/                    # Route handlers (controllers)
│   │   │   ├── auth.py             # Registration, login, JWT
│   │   │   ├── oauth.py            # Google OAuth 2.0 flow
│   │   │   ├── chat.py             # LLM streaming chat endpoints
│   │   │   ├── voice.py            # TTS and STT endpoints
│   │   │   ├── rag.py              # Document upload & RAG query
│   │   │   ├── code_agent.py       # Sandboxed code execution
│   │   │   ├── image.py            # Image generation
│   │   │   ├── snippets.py         # Saved code snippets
│   │   │   ├── settings.py         # User preferences
│   │   │   └── admin.py            # Admin panel endpoints
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic settings management
│   │   │   └── security.py         # JWT, password hashing
│   │   ├── database/               # DB connection & session management
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   └── services/               # Business logic layer
│   │       ├── llm_service.py      # Multi-provider LLM orchestration
│   │       ├── tts_service.py      # Edge-TTS voice synthesis
│   │       ├── stt_service.py      # Faster Whisper transcription
│   │       ├── rag_service.py      # ChromaDB RAG pipeline
│   │       ├── code_service.py     # Docker sandbox management
│   │       └── image_service.py    # Image generation
│   ├── Dockerfile                  # Backend container definition
│   └── requirements.txt            # Python dependencies
│
├── ⚛️  frontend/                    # React 18 TypeScript frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Route-level page components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── services/               # API client layer
│   │   └── types/                  # TypeScript type definitions
│   ├── public/                     # Static assets
│   ├── vite.config.ts              # Vite configuration
│   └── package.json                # Node.js dependencies
│
├── 🐳 sandbox/                     # Code execution Docker environment
├── 🔊 TTS and STT/                 # Voice model assets
├── 🏗️  infra/                       # Infrastructure configuration
└── 💾 data/                        # Persistent data volumes
```

---

## 📡 API Reference

The full interactive Swagger UI is available at **`http://localhost:8000/docs`** when the backend is running.

### Endpoint Groups

| Group              | Base Path        | Description                               |
| :----------------- | :--------------- | :---------------------------------------- |
| **Authentication** | `/api/auth/`     | Register, login, logout, password reset   |
| **OAuth**          | `/api/oauth/`    | Google OAuth 2.0 flow                     |
| **Chat**           | `/api/chat/`     | LLM streaming chat, history, shared links |
| **Voice**          | `/api/voice/`    | TTS synthesis, STT transcription          |
| **RAG**            | `/api/rag/`      | Document upload, knowledge base, query    |
| **Code Agent**     | `/api/code/`     | Sandboxed Python execution                |
| **Image**          | `/api/image/`    | AI image generation                       |
| **Snippets**       | `/api/snippets/` | Save and manage code snippets             |
| **Settings**       | `/api/settings/` | User preferences and profile              |
| **Admin**          | `/api/admin/`    | User management and system stats          |

### Key Endpoints

```http
# Authentication
POST /api/auth/register          # Create account
POST /api/auth/login             # Get JWT token
POST /api/auth/verify-otp        # Verify 2FA OTP
POST /api/auth/refresh           # Refresh JWT token

# Streaming Chat
POST /api/chat/stream            # SSE streaming chat (LLM)
GET  /api/chat/history           # Get conversation history
POST /api/chat/share             # Generate shareable link

# Voice
POST /api/voice/tts              # Text-to-Speech synthesis
POST /api/voice/stt              # Speech-to-Text transcription

# RAG
POST /api/rag/upload             # Upload document to knowledge base
POST /api/rag/query              # Query knowledge base with AI
GET  /api/rag/documents          # List uploaded documents
DELETE /api/rag/documents/{id}   # Remove document

# Code Execution
POST /api/code/execute           # Run Python in Docker sandbox (WebSocket)
```

---

## 🔐 Security Model

InfiChat was built with a **defense-in-depth** security philosophy:

### Authentication Security

- **Bcrypt hashing** (cost factor 12) for all stored passwords
- **JWT tokens** with short-lived access tokens (60min) and refresh tokens (30d)
- **OTP two-factor authentication** for additional login verification
- **Google OAuth 2.0** — tokens validated server-side, never exposed to frontend

### API Security

- **Rate limiting** via SlowAPI on all endpoints — configurable per route
- **CORS** — strict origin allowlist, no wildcard in production
- **Input validation** via Pydantic v2 — all inputs sanitized and validated
- **SQL injection prevention** — 100% ORM-based queries (SQLAlchemy)
- **JWT signature verification** on every protected route

### Sandbox Security

- **Docker isolation** — code runs in a dedicated container with no host filesystem access
- **Resource limits** — CPU, memory, and execution time caps enforced
- **Network isolation** — sandbox container has no external network access
- **Ephemeral containers** — destroyed after each session

### Privacy

- **PII scrubbing** — auto-redacts emails, phone numbers, names from logs
- **Local inference** — Whisper STT and embedding models run entirely on-device
- **No telemetry** — zero analytics, zero data collection

---

## 🚀 Deployment

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.9"
services:
  backend:
    build: ./backend
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "5173:80"

  postgres:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: autoagent
      POSTGRES_USER: ai
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  pg_data:
  redis_data:
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_buffering off;          # Required for SSE streaming
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

### Environment Notes for Production

- Set `ENVIRONMENT=production` to disable debug mode and Swagger UI exposure
- Rotate `SECRET_KEY` with a cryptographically random 256-bit value
- Enable HTTPS via Let's Encrypt (Certbot) for all public deployments
- Configure PostgreSQL with proper connection pooling (`pgbouncer` recommended)

---

## 🎙️ Voice System Deep Dive

### TTS Pipeline

```
User requests TTS
      │
      ▼
tts_service.py → edge-tts.Communicate(text, voice=profile)
      │
      ▼
Async MP3 chunk generator
      │
      ▼
StreamingResponse (MIME: audio/mpeg)
      │
      ▼
Browser Audio element — starts playing on first chunk
```

**Indian Number Normalization Examples:**

| Input        | Spoken Output                    |
| :----------- | :------------------------------- |
| `₹1,50,000`  | "One lakh fifty thousand rupees" |
| `2.5 Cr`     | "Two point five crore"           |
| `10L`        | "Ten lakh"                       |
| `Dr. Sharma` | "Doctor Sharma"                  |

### STT Pipeline

```
User records audio (browser MediaRecorder API)
      │
      ▼
Audio blob → POST /api/voice/stt (multipart)
      │
      ▼
faster_whisper.WhisperModel.transcribe(audio_file)
      │
      ▼
Returns: { text: "...", language: "en", confidence: 0.98 }
```

---

## 📚 RAG System Deep Dive

```
Document Upload → PyPDF/python-docx parse
      │
      ▼
Recursive text chunking (512 tokens, 64-token overlap)
      │
      ▼
sentence-transformers encode → 384-dim vectors
      │
      ▼
ChromaDB.add() → persisted to local disk
      │
      ▼
On Query: ChromaDB.query(embedding, n_results=5)
      │
      ▼
Top-k chunks → injected as system context to LLM
      │
      ▼
LLM responds with grounded, document-cited answer
```

**Supported Document Formats:**

| Format | Parser          | Max Size |
| :----- | :-------------- | :------: |
| PDF    | `pypdf`         |  50 MB   |
| DOCX   | `python-docx`   |  50 MB   |
| TXT    | Python built-in |  50 MB   |

---

## 🤖 Code Agent Deep Dive

```
User sends code request → LLM writes Python code
      │
      ▼
code_service.py → docker.client.containers.run(
    image="python:3.11-slim",
    command=["python", "-c", code],
    mem_limit="256m",
    cpu_period=100000,
    cpu_quota=50000,        # 50% CPU limit
    network_disabled=True,  # No internet
    remove=True             # Ephemeral
)
      │
      ▼
stdout/stderr → streamed via WebSocket to frontend
      │
      ▼
On error: LLM reads traceback → self-debugs → re-executes
```

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start — `ModuleNotFoundError`**

```bash
# Ensure virtual environment is activated
cd backend && .\venv\Scripts\activate
pip install -r requirements.txt
```

**Database connection error**

```bash
# Verify PostgreSQL is running
psql -U ai -d autoagent -h localhost
# Re-run schema initialization
python fix_db_schema.py
```

**Docker sandbox fails**

```bash
# Ensure Docker Desktop is running
docker info
# Pull the Python sandbox image
docker pull python:3.11-slim
```

**TTS produces no audio**

```bash
# Test edge-tts directly
python -m edge_tts --voice en-IN-PrabhatNeural --text "Hello" --write-media test.mp3
```

**Whisper STT is slow**

```bash
# Use a smaller model for faster CPU inference
# In config.py: whisper_model = "tiny" or "base"
```

**ChromaDB vector dimension mismatch**

```bash
# Delete the ChromaDB collection and re-upload documents
# ChromaDB data is stored in: data/chromadb/
rm -rf data/chromadb/
```

### Logs

| Log Location                 | Contents                 |
| :--------------------------- | :----------------------- |
| `backend/backend_errors.log` | Backend Python errors    |
| Browser DevTools → Network   | Frontend API call errors |
| `docker logs <container_id>` | Docker container logs    |

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get involved:

### Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Self-Hosted-Generative-AI-Chatbot.git
   ```
3. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-amazing-feature
   ```
4. **Make** your changes following our code style
5. **Test** your changes thoroughly
6. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat: add support for Whisper large-v3 model"
   ```
7. **Push** and open a Pull Request:
   ```bash
   git push origin feature/your-amazing-feature
   ```

### Contribution Guidelines

- Follow **PEP 8** for Python code
- Use **TypeScript** (not plain JavaScript) for all frontend changes
- Add **docstrings** to all new Python functions
- Write **descriptive commit messages** (conventional commits preferred)
- Include **documentation updates** for any new features
- Ensure no **API keys or secrets** are committed (check `.gitignore`)

### Areas We'd Love Help With

- [ ] Mobile-responsive UI improvements
- [ ] Additional LLM provider integrations
- [ ] i18n / internationalization support
- [ ] Automated test suite (pytest + Playwright)
- [ ] Helm chart for Kubernetes deployment
- [ ] Additional Indic language TTS voices

---

## 📜 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it for any purpose.

```
MIT License

Copyright (c) 2025 Guguloth Ubhavith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

See the [LICENSE](LICENSE) file for full details.

---

## 🙏 Acknowledgements

InfiChat is built on the shoulders of incredible open-source projects:

- [**FastAPI**](https://fastapi.tiangolo.com/) — The world's fastest Python web framework
- [**React**](https://react.dev/) — A performant UI library by Meta
- [**ChromaDB**](https://www.trychroma.com/) — The AI-native open-source embedding database
- [**Faster Whisper**](https://github.com/SYSTRAN/faster-whisper) — CTranslate2-powered speech recognition
- [**Edge TTS**](https://github.com/rany2/edge-tts) — Microsoft Edge's neural TTS engine
- [**Ollama**](https://ollama.com/) — Local LLM runner made simple
- [**sentence-transformers**](https://www.sbert.net/) — State-of-the-art sentence embeddings

---

<p align="center">
  <strong>Built with ❤️ for the Open Source AI Community</strong><br>
  <em>Empowering individuals and organizations to own their AI — privately, securely, and completely.</em>
</p>

<p align="center">
  <a href="https://github.com/gugulothubhavith/Self-Hosted-Generative-AI-Chatbot/issues">🐛 Report a Bug</a> •
  <a href="https://github.com/gugulothubhavith/Self-Hosted-Generative-AI-Chatbot/issues">💡 Request a Feature</a> •
  <a href="https://github.com/gugulothubhavith/Self-Hosted-Generative-AI-Chatbot/discussions">💬 Join Discussions</a>
</p>
