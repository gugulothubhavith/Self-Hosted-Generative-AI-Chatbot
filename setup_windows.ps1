# setup_windows.ps1
# Windows Setup Script for AI Chatbot

$ErrorActionPreference = "Stop"

Write-Host "AI Platform Startup Script (Windows)" -ForegroundColor Cyan
Write-Host "=============================="

# Check for Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop."
    exit 1
}

# 1. GPU Detection & Environment Setup
Write-Host "Detecting GPU..." -ForegroundColor Yellow
$envContent = ""

if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    Write-Host "NVIDIA GPU detected" -ForegroundColor Green
    try {
        # Fix: Drop all special formatting flags. Just use basic CSV.
        # Output will be:
        # memory.total [MiB]
        # 4096 MiB
        $vramOutput = nvidia-smi --query-gpu=memory.total --format=csv
        
        $vramMB = 0
        foreach ($line in ($vramOutput -split '\r?\n')) {
            $line = $line.Trim()
            # Skip header line
            if ($line -match 'memory') { continue }
             
            # Match digits at the start of the string
            if ($line -match '^(\d+)') {
                $vramMB = [int]$matches[1]
                break
            }
        }
        
        if ($vramMB -eq 0) { throw "Could not find valid VRAM amount" }

        $vramGB = [math]::Round($vramMB / 1024)
        Write-Host "Total VRAM: ${vramGB}GB"

        if ($vramGB -ge 80) {
            Write-Host "HIGH-END GPU Detected" -ForegroundColor Green
            $envContent = "MODEL_TIER=high`nCODE_LLAMA=34B`nLLAMA3=70B`nMIXTRAL=8x22B`nUSE_CPU=0"
        }
        elseif ($vramGB -ge 48) {
            Write-Host "MID-RANGE GPU Detected" -ForegroundColor Yellow
            $envContent = "MODEL_TIER=medium`nCODE_LLAMA=34B`nLLAMA3=8B`nMIXTRAL=disabled`nUSE_CPU=0"
        }
        elseif ($vramGB -ge 24) {
            Write-Host "LOW-RESOURCE GPU Detected" -ForegroundColor Red
            $envContent = "MODEL_TIER=low`nCODE_LLAMA=13B-Q4`nLLAMA3=8B-Q4`nMIXTRAL=disabled`nUSE_CPU=0"
        }
        else {
            Write-Host "VRAM too low for full acceleration. Using Low/CPU mix." -ForegroundColor Red
            $envContent = "MODEL_TIER=cpu`nUSE_CPU=1"
        }
    }
    catch {
        Write-Warning "Could not parse nvidia-smi output. Defaulting to CPU mode."
        $envContent = "MODEL_TIER=cpu`nUSE_CPU=1"
    }
}
else {
    Write-Host "No NVIDIA GPU detected. Using CPU mode." -ForegroundColor Red
    $envContent = "MODEL_TIER=cpu`nUSE_CPU=1"
}

# Write .env file
$envPath = Join-Path $PSScriptRoot "infra\.env"
Set-Content -Path $envPath -Value $envContent
Write-Host "Configuration saved to infra\.env"

# 2. Create data directories
Write-Host "Creating data directories..." -ForegroundColor Yellow
$dirs = @("data\postgres", "data\chromadb", "data\models", "data\sandbox")
foreach ($d in $dirs) {
    $path = Join-Path $PSScriptRoot $d
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        Write-Host "  Created $d"
    }
}

# 3. Pull Models (Python)
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Downloading models (Embeddings)..." -ForegroundColor Yellow
    try {
        python -c "from transformers import AutoModel; import os; os.environ['HF_HOME'] = './data/models'; print('Downloading BGE-Large...'); AutoModel.from_pretrained('BAAI/bge-large-en-v1.5'); print('Done.')"
    }
    catch {
        Write-Warning "Failed to download models via Python. Docker services might handle this."
    }
}
else {
    Write-Warning "Python not found. Skipping local model download pre-cache."
}

# 4. Start Docker Compose
Write-Host "Starting Docker services..." -ForegroundColor Cyan
Set-Location -Path (Join-Path $PSScriptRoot "infra")
docker-compose up -d --build
Set-Location -Path $PSScriptRoot

Write-Host "`nAI Platform is starting!" -ForegroundColor Green
Write-Host "Services will be available at:"
Write-Host "  Frontend:    http://localhost:5173"
Write-Host "  Backend:     http://localhost:8000"
Write-Host "  Swagger:     http://localhost:8000/docs"

# Auto-open all services
Write-Host "`nOpening application services in your default browser..." -ForegroundColor Cyan

# Wait for Backend to be ready
Write-Host "Waiting for Backend to be ready..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0
$backendReady = $false

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    }
    catch {
        # Ignore errors and retry
    }
    $retryCount++
    Start-Sleep -Seconds 2
}

if ($backendReady) {
    Write-Host "Backend is ready!" -ForegroundColor Green
} else {
    Write-Host "Backend wait timed out, opening anyway..." -ForegroundColor Red
}

Start-Process "http://localhost:5173"       # Frontend
Start-Sleep -Seconds 1
Start-Process "http://localhost:8000/docs"  # Swagger UI

