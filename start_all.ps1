# CivicConnect Full-Stack Unified Launcher Script
# Starts AI Microservice (Port 8000), Spring Boot Backend (Port 8080), and React Frontend (Port 5173)

$root = $PSScriptRoot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       Starting CivicConnect Full-Stack Services           " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# --- Check JAVA_HOME so Spring Boot doesn't silently fail ---
if (-not $env:JAVA_HOME) {
    Write-Host "[WARNING] JAVA_HOME is not set. Spring Boot may fail if Java is not on PATH." -ForegroundColor Red
    Write-Host "          Set it via: `$env:JAVA_HOME = 'C:\path\to\jdk-17'" -ForegroundColor Red
}

# --- AI Service: Activate Python venv/conda if present, then start uvicorn ---
Write-Host "[1/3] Starting Python AI Microservice (Port 8000)..." -ForegroundColor Yellow
$aiVenvActivate = "if (Test-Path '$root\ai-service\.venv\Scripts\Activate.ps1') { & '$root\ai-service\.venv\Scripts\Activate.ps1' } elseif (Test-Path '$root\ai-service\venv\Scripts\Activate.ps1') { & '$root\ai-service\venv\Scripts\Activate.ps1' };"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\ai-service'; $aiVenvActivate python -m uvicorn main:app --host 127.0.0.1 --port 8000"

Write-Host "[2/3] Starting Java Spring Boot 3 Backend (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; mvn spring-boot:run"

Write-Host "[3/3] Starting React Vite Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

Write-Host "============================================================" -ForegroundColor Green
Write-Host "All 3 services are launching in separate PowerShell windows!" -ForegroundColor Green
Write-Host "  - AI Microservice:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Spring Boot API:  http://localhost:8080/api/complaints" -ForegroundColor White
Write-Host "  - React Web App:    http://localhost:5173/" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
