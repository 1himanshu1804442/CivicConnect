@echo off
title CivicConnect - Full Stack Launcher
echo ============================================================
echo        Starting CivicConnect Full-Stack Services
echo ============================================================
echo [1/3] Starting Python AI Microservice (FastAPI + OpenCV) on port 8000...
start "CivicConnect - AI Service (8000)" cmd /k "cd /d %~dp0ai-service && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [2/3] Starting Java Spring Boot 3 Backend on port 8080...
start "CivicConnect - Spring Boot Backend (8080)" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo [3/3] Starting React Vite Frontend on port 5173...
start "CivicConnect - React Frontend (5173)" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo ============================================================
echo All 3 services are launching in separate terminal windows!
echo   - AI Microservice:  http://localhost:8000/docs
echo   - Spring Boot API:  http://localhost:8080/api/complaints
echo   - React Web App:    http://localhost:5173/
echo ============================================================
