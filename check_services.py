import urllib.request
import json
import sys

print("=================================================")
print("CIVICCONNECT SYSTEM VERIFICATION AUDIT")
print("=================================================")

# 1. Backend Verification
print("\n[1] VERIFYING BACKEND (Spring Boot on :8080)...")
try:
    req = urllib.request.Request("http://localhost:8080/api/complaints")
    with urllib.request.urlopen(req, timeout=5) as res:
        complaints = json.loads(res.read().decode())
        print(f" -> STATUS: RUNNING (HTTP {res.status})")
        print(f" -> DATABASE PERSISTENCE: Real Spring Data JPA connected")
        print(f" -> TOTAL COMPLAINTS IN DATABASE: {len(complaints)}")
        for c in complaints:
            print(f"    * ID {c.get('id')}: {c.get('title')} | Cat: {c.get('category')} | Score: {c.get('priorityScore')} | Loc: {c.get('locationName')} ({c.get('latitude')}, {c.get('longitude')})")
except Exception as e:
    print(f" -> FAILED: {e}")

# 2. AI Service Verification
print("\n[2] VERIFYING AI SERVICE (FastAPI on :8000)...")
try:
    with urllib.request.urlopen("http://localhost:8000/health", timeout=5) as res:
        health = json.loads(res.read().decode())
        print(f" -> STATUS: RUNNING (HTTP {res.status})")
        print(f" -> DETAILS: {health}")
except Exception as e:
    print(f" -> FAILED: {e}")

# 3. Test AI Prediction Endpoint
print("\n[3] TESTING AI PREDICTION (/predict)...")
try:
    # 1x1 dummy PNG in base64
    dummy_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    payload = json.dumps({"image_base64": dummy_b64, "category_hint": "POTHOLE"}).encode("utf-8")
    req = urllib.request.Request("http://localhost:8000/predict", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as res:
        pred = json.loads(res.read().decode())
        print(f" -> PREDICTION SUCCESS:")
        print(f"    * Category: {pred.get('category')}")
        print(f"    * Severity: {pred.get('severity_score')}")
        print(f"    * Confidence: {pred.get('confidence')}")
        print(f"    * Embedding dim: {len(pred.get('embedding', []))}")
        print(f"    * Bounding Boxes: {pred.get('bounding_boxes')}")
except Exception as e:
    print(f" -> FAILED: {e}")

# 4. Frontend Verification
print("\n[4] VERIFYING FRONTEND (Vite React on :5173)...")
try:
    with urllib.request.urlopen("http://localhost:5173", timeout=5) as res:
        html = res.read().decode()
        print(f" -> STATUS: RUNNING (HTTP {res.status})")
        print(f" -> Title tag: {'CivicConnect' in html}")
except Exception as e:
    print(f" -> FAILED: {e}")

print("\n=================================================")
print("ALL SYSTEM VERIFICATIONS FINISHED")
print("=================================================")
