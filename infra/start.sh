#!/bin/bash

set -e

echo "🚀 AI Platform Startup Script"
echo "=============================="

# Load environment
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# 1. GPU Detection
echo "📊 Detecting GPU..."
bash gpu_detect.sh

# 2. Create directories
echo "📁 Creating data directories..."
mkdir -p ./data/postgres ./data/chromadb ./data/models ./data/sandbox

# 3. Pull models (optional - can be done separately)
echo "⬇️  Downloading models (first run only)..."
python3 << 'EOF'
from transformers import AutoModel, AutoTokenizer
import os

os.environ["HF_HOME"] = "./data/models"

print("Downloading embeddings model...")
AutoModel.from_pretrained("BAAI/bge-large-en-v1.5")

print("Models ready!")
EOF

# 4. Start Docker Compose
echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "✅ AI Platform is starting!"
echo ""
echo "Services:"
echo "  Frontend:    http://localhost:5173"
echo "  Backend:     http://localhost:8000"
echo "  Postgres:   localhost:5432"
echo "  Redis:      localhost:6379"
echo "  ChromaDB:   localhost:8001"
echo ""
echo "Model Servers:"
echo "  Code-LLaMA 34B:   http://localhost:8002"
echo "  Code-LLaMA 13B:  http://localhost:8003"
echo "  LLaMA3 70B:      http://localhost:8004"
echo "  LLaMA3 8B:       http://localhost:8005"
echo "  Mixtral:          http://localhost:8006"
echo "  SDXL:            http://localhost:8007"
echo ""
echo "📊 Check logs:"
echo "  docker-compose logs -f backend"
echo ""
echo "🛑 To stop:"
echo "  docker-compose down"