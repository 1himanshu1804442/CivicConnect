import urllib.request
import json

print("\n[5] TESTING BACKEND UPVOTE (/api/complaints/2/upvote)...")
req = urllib.request.Request("http://localhost:8080/api/complaints/2/upvote", data=b"", headers={"Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        print(f" -> UPVOTE SUCCESS! Complaint ID {data.get('id')}: duplicateCount={data.get('duplicateCount')}, priorityScore={data.get('priorityScore')}")
except Exception as e:
    print(f" -> UPVOTE FAILED: {e}")

print("\n[6] TESTING BACKEND RESOLVE (/api/complaints/2/resolve)...")
resolve_payload = json.dumps({
    "resolvedImageUrl": "/samples/pothole_fixed.jpg",
    "resolutionNotes": "Pothole filled with cold mix asphalt and steam rolled."
}).encode("utf-8")
req2 = urllib.request.Request("http://localhost:8080/api/complaints/2/resolve", data=resolve_payload, headers={"Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req2, timeout=5) as resp:
        data2 = json.loads(resp.read().decode())
        print(f" -> RESOLVE SUCCESS! Complaint ID {data2.get('id')}: status={data2.get('status')}, resolutionNotes='{data2.get('resolutionNotes')}'")
except Exception as e:
    print(f" -> RESOLVE FAILED: {e}")
