#!/bin/bash

# GPU Detection & Model Selection Script
# Purpose: Automatically detect GPU VRAM and select appropriate models

check_nvidia() {
    if command -v nvidia-smi &> /dev/null; then
        echo "✓ NVIDIA GPU detected"
        TOTAL_VRAM=$(nvidia-smi --query-gpu=memory.total --format=csv,nounits,noheader | head -1)
        TOTAL_VRAM_GB=$((TOTAL_VRAM / 1024))
        echo "Total VRAM: ${TOTAL_VRAM_GB}GB"
        return 0
    else
        echo "✗ No NVIDIA GPU detected"
        return 1
    fi
}

select_models() {
    if [ $TOTAL_VRAM_GB -ge 80 ]; then
        echo "🟢 HIGH-END GPU:  Running all 70B models"
        export MODEL_TIER="high"
        export CODE_LLAMA="34B"
        export LLAMA3="70B"
        export MIXTRAL="8x22B"
    elif [ $TOTAL_VRAM_GB -ge 48 ]; then
        echo "🟡 MID-RANGE GPU: Running 34B + 13B models"
        export MODEL_TIER="medium"
        export CODE_LLAMA="34B"
        export LLAMA3="8B"
        export MIXTRAL="disabled"
    elif [ $TOTAL_VRAM_GB -ge 24 ]; then
        echo "🟠 LOW-RESOURCE GPU: Running quantized 13B models"
        export MODEL_TIER="low"
        export CODE_LLAMA="13B-Q4"
        export LLAMA3="8B-Q4"
        export MIXTRAL="disabled"
    else
        echo "🔴 CPU-ONLY MODE:  Running CPU-optimized models"
        export MODEL_TIER="cpu"
        export USE_CPU=1
    fi
}

generate_env() {
    cat > .env. gpu << EOF
MODEL_TIER=${MODEL_TIER}
CODE_LLAMA_MODEL=${CODE_LLAMA}
LLAMA3_MODEL=${LLAMA3}
MIXTRAL_ENABLED=$( [[ "$MIXTRAL" != "disabled" ]] && echo "1" || echo "0")
USE_CPU=${USE_CPU:-0}
TOTAL_VRAM_GB=${TOTAL_VRAM_GB}
EOF
    echo "✓ GPU config saved to .env.gpu"
}

main() {
    echo "🚀 AI Platform GPU Detection"
    echo "=============================="
    
    if check_nvidia; then
        select_models
        generate_env
        echo ""
        echo "Recommended:  docker-compose up -d"
    else
        echo ""
        echo "⚠️  GPU not detected. Using CPU fallback."
        echo "Note: Performance will be limited.  Consider using GPU for production."
        export MODEL_TIER="cpu"
        export USE_CPU=1
        generate_env
    fi
}

main "$@"