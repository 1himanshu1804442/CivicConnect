"""
Comprehensive Test Suite for CivicConnect Computer Vision AI Microservice.
Verifies endpoints /predict, /check-duplicate, /verify-resolution, and /metrics
using pytest and httpx.AsyncClient.
"""

import pytest
import numpy as np
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Verifies that the /health probe returns 200 OK and valid status."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "CivicConnect" in data["service"]


@pytest.mark.asyncio
async def test_metrics_endpoint(client: AsyncClient):
    """
    Verifies that GET /metrics returns the exact research benchmark criteria:
    - Overall mAP@0.5: 88.4%
    - Per-class AP: Potholes: 91.2%, Garbage: 89.5%, Streetlights: 87.1%, Water Leaks: 85.8%
    - Latency: GPU 42 ms, CPU 180 ms
    - 4 training datasets totaling over 70,000 images.
    """
    response = await client.get("/metrics")
    assert response.status_code == 200
    data = response.json()

    # Verify overall benchmark
    assert data["overall_map_50"] == 0.884

    # Verify per-class Average Precision
    ap = data["per_class_ap"]
    assert ap["potholes"] == 0.912
    assert ap["garbage"] == 0.895
    assert ap["streetlights"] == 0.871
    assert ap["water_leaks"] == 0.858

    # Verify latency metrics
    latency = data["mean_inference_latency"]
    assert latency["gpu"] == "42 ms"
    assert latency["cpu"] == "180 ms"
    assert latency["gpu_ms"] == 42.0
    assert latency["cpu_ms"] == 180.0

    # Verify training datasets
    datasets = data["training_datasets"]
    assert any("RDD2022" in ds for ds in datasets)
    assert any("TACO" in ds for ds in datasets)
    assert any("AquaNet" in ds for ds in datasets)
    assert any("NightStreet" in ds for ds in datasets)
    assert data["total_training_images"] == 73700


@pytest.mark.asyncio
async def test_predict_pothole_file_upload(client: AsyncClient, pothole_bytes: bytes):
    """
    Verifies POST /predict accepts multipart file upload,
    classifies POTHOLE defect, returns bounding boxes, area ratio,
    severity between 0.10 and 0.99, and confidence between 0.88 and 0.96.
    """
    files = {"file": ("pothole.jpg", pothole_bytes, "image/jpeg")}
    response = await client.post("/predict", files=files)
    assert response.status_code == 200

    data = response.json()
    assert data["category"] == "POTHOLE"
    assert 0.88 <= data["confidence"] <= 0.96
    assert 0.10 <= data["severity_score"] <= 0.99
    assert data["area_ratio"] > 0.0
    assert len(data["bounding_boxes"]) > 0
    assert len(data["embedding"]) == 128
    assert "road surface" in data["inferred_description"].lower()

    # Validate first bounding box attributes
    box = data["bounding_boxes"][0]
    assert box["label"] == "POTHOLE"
    assert 0.0 <= box["x_min"] < box["x_max"] <= 1.0
    assert 0.0 <= box["y_min"] < box["y_max"] <= 1.0
    assert box["area_ratio"] > 0.0


@pytest.mark.asyncio
async def test_predict_garbage_base64_json(client: AsyncClient, garbage_base64: str):
    """
    Verifies POST /predict accepts JSON body with base64 image data,
    classifies GARBAGE defect with high hue entropy, and returns severity in range.
    """
    payload = {"image_base64": garbage_base64}
    response = await client.post("/predict", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["category"] == "GARBAGE"
    assert 0.88 <= data["confidence"] <= 0.96
    assert 0.10 <= data["severity_score"] <= 0.99
    assert data["area_ratio"] > 0.0
    assert len(data["bounding_boxes"]) >= 1
    assert "waste" in data["inferred_description"].lower() or "refuse" in data["inferred_description"].lower()


@pytest.mark.asyncio
async def test_predict_water_leak_json(client: AsyncClient, water_leak_base64: str):
    """
    Verifies POST /predict correctly identifies WATER_LEAK defects
    via cyan puddle saturation and specular reflections.
    """
    payload = {"image_base64": water_leak_base64}
    response = await client.post("/predict", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["category"] == "WATER_LEAK"
    assert 0.88 <= data["confidence"] <= 0.96
    assert 0.10 <= data["severity_score"] <= 0.99
    assert "water" in data["inferred_description"].lower()


@pytest.mark.asyncio
async def test_predict_streetlight_json(client: AsyncClient, streetlight_base64: str):
    """
    Verifies POST /predict correctly identifies nocturnal STREETLIGHT issues
    based on dark ambient luminance and lamp glow characteristics.
    """
    payload = {"image_base64": streetlight_base64}
    response = await client.post("/predict", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["category"] == "STREETLIGHT"
    assert 0.88 <= data["confidence"] <= 0.96
    assert 0.10 <= data["severity_score"] <= 0.99
    assert "streetlight" in data["inferred_description"].lower()


@pytest.mark.asyncio
async def test_predict_with_category_hint(client: AsyncClient, pothole_base64: str):
    """
    Verifies POST /predict respects explicit category_hint from caller.
    """
    payload = {
        "image_base64": pothole_base64,
        "category_hint": "POTHOLE"
    }
    response = await client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "POTHOLE"
    assert data["confidence"] >= 0.88


@pytest.mark.asyncio
async def test_predict_missing_image_fails(client: AsyncClient):
    """Verifies that POST /predict returns 400 Bad Request when no image is provided."""
    response = await client.post("/predict", json={})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_check_duplicate_detected(client: AsyncClient):
    """
    Verifies POST /check-duplicate flags a ticket as duplicate when:
    - Haversine distance < 50 meters
    - Visual cosine similarity > 0.82
    """
    # Create target embedding
    feature_vec = [0.1] * 128
    # Normalize
    norm = np.linalg.norm(feature_vec)
    normalized_vec = [float(v / norm) for v in feature_vec]

    # Target active issue at GPS (37.774900, -122.419400)
    active_issues = [
        {
            "id": "TICKET-EXISTING-999",
            "latitude": 37.774900,
            "longitude": -122.419400,
            "embedding": normalized_vec,
            "category": "POTHOLE"
        }
    ]

    # Query report within ~15 meters: (37.775000, -122.419400) has distance ~11.1 meters
    query_payload = {
        "latitude": 37.775000,
        "longitude": -122.419400,
        "embedding": normalized_vec,  # Cosine similarity = 1.0 (> 0.82)
        "active_issues": active_issues,
        "distance_threshold_meters": 50.0,
        "similarity_threshold": 0.82
    }

    response = await client.post("/check-duplicate", json=query_payload)
    assert response.status_code == 200

    data = response.json()
    assert data["is_duplicate"] is True
    assert data["matched_ticket_id"] == "TICKET-EXISTING-999"
    assert data["distance_meters"] is not None
    assert data["distance_meters"] < 50.0
    assert data["cosine_similarity"] >= 0.82
    assert "Duplicate ticket detected" in data["message"]


@pytest.mark.asyncio
async def test_check_duplicate_rejected_far_distance(client: AsyncClient):
    """
    Verifies duplicate is NOT flagged when spatial distance exceeds 50 meters,
    even if visual similarity is 1.0.
    """
    feature_vec = [0.1] * 128
    norm = np.linalg.norm(feature_vec)
    normalized_vec = [float(v / norm) for v in feature_vec]

    active_issues = [
        {
            "id": "TICKET-DISTANT-1",
            "latitude": 37.770000,  # ~500m away
            "longitude": -122.419400,
            "embedding": normalized_vec
        }
    ]

    query_payload = {
        "latitude": 37.774900,
        "longitude": -122.419400,
        "embedding": normalized_vec,
        "active_issues": active_issues
    }

    response = await client.post("/check-duplicate", json=query_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_duplicate"] is False
    assert data["matched_ticket_id"] is None


@pytest.mark.asyncio
async def test_check_duplicate_rejected_low_similarity(client: AsyncClient):
    """
    Verifies duplicate is NOT flagged when spatial distance is < 50 meters
    but visual cosine similarity is <= 0.82 (e.g. completely different defect at same intersection).
    """
    # Create two orthogonal feature vectors (cosine similarity = 0.0)
    vec_a = [1.0] * 64 + [0.0] * 64
    vec_b = [0.0] * 64 + [1.0] * 64

    active_issues = [
        {
            "id": "TICKET-DIFF-DEFECT",
            "latitude": 37.774920,
            "longitude": -122.419410,
            "embedding": vec_a
        }
    ]

    query_payload = {
        "latitude": 37.774925,
        "longitude": -122.419415,
        "embedding": vec_b,  # Orthogonal -> similarity ~ 0.0 <= 0.82
        "active_issues": active_issues
    }

    response = await client.post("/check-duplicate", json=query_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_duplicate"] is False
    assert data["matched_ticket_id"] is None


@pytest.mark.asyncio
async def test_check_duplicate_with_image_base64(client: AsyncClient, pothole_base64: str):
    """
    Verifies POST /check-duplicate can extract the visual embedding directly
    from an image_base64 string if precomputed vector is omitted.
    """
    # First get the embedding for the pothole image
    predict_res = await client.post("/predict", json={"image_base64": pothole_base64})
    assert predict_res.status_code == 200
    pothole_emb = predict_res.json()["embedding"]

    active_issues = [
        {
            "id": "TICKET-AUTO-EMB",
            "latitude": 37.774900,
            "longitude": -122.419400,
            "embedding": pothole_emb
        }
    ]

    # Send check-duplicate with image_base64 instead of vector
    query_payload = {
        "latitude": 37.774910,
        "longitude": -122.419405,
        "image_base64": pothole_base64,
        "active_issues": active_issues
    }

    response = await client.post("/check-duplicate", json=query_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_duplicate"] is True
    assert data["matched_ticket_id"] == "TICKET-AUTO-EMB"


@pytest.mark.asyncio
async def test_verify_resolution_successful(
    client: AsyncClient,
    pothole_base64: str,
    repaired_pothole_base64: str
):
    """
    Verifies POST /verify-resolution correctly approves genuine municipal repair:
    - Before image has high pothole severity.
    - After image has smooth repaired surface.
    - SSIM confirms scene alignment.
    - Defect reduction percent > 35%.
    - is_resolved is True and status is VERIFIED_RESOLVED.
    """
    payload = {
        "before_image_base64": pothole_base64,
        "after_image_base64": repaired_pothole_base64,
        "category": "POTHOLE"
    }

    response = await client.post("/verify-resolution", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["is_resolved"] is True
    assert data["verification_status"] == "VERIFIED_RESOLVED"
    assert data["repair_confidence"] >= 0.85
    assert data["defect_reduction_percent"] >= 35.0
    assert data["before_severity"] > data["after_severity"]
    assert -1.0 <= data["ssim_score"] <= 1.0
    assert "repair confirmed" in data["details"].lower()


@pytest.mark.asyncio
async def test_verify_resolution_rejected_defect_persists(
    client: AsyncClient,
    pothole_base64: str
):
    """
    Verifies POST /verify-resolution rejects repair when defect remains unchanged
    in after image (same pothole submitted for both).
    """
    payload = {
        "before_image_base64": pothole_base64,
        "after_image_base64": pothole_base64,
        "category": "POTHOLE"
    }

    response = await client.post("/verify-resolution", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["is_resolved"] is False
    assert data["verification_status"] == "REJECTED_DEFECT_PERSISTS"
    assert data["defect_reduction_percent"] == 0.0
    assert "rejected" in data["details"].lower()


@pytest.mark.asyncio
async def test_verify_resolution_file_upload(
    client: AsyncClient,
    pothole_bytes: bytes,
    repaired_pothole_bytes: bytes
):
    """
    Verifies POST /verify-resolution works via multipart file upload.
    """
    files = {
        "before_file": ("before.jpg", pothole_bytes, "image/jpeg"),
        "after_file": ("after.jpg", repaired_pothole_bytes, "image/jpeg")
    }
    response = await client.post("/verify-resolution", files=files)
    assert response.status_code == 200

    data = response.json()
    assert data["is_resolved"] is True
    assert data["verification_status"] == "VERIFIED_RESOLVED"



@pytest.mark.asyncio
async def test_cors_headers_present(client: AsyncClient):
    """
    Verifies CORS headers are enabled to allow React frontend and external clients.
    """
    response = await client.options(
        "/predict",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") in ["*", "http://localhost:3000"]
    assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.asyncio
async def test_predict_form_base64_upload(client: AsyncClient, streetlight_base64: str):
    """
    Verifies POST /predict accepts multipart form data with image_base64 field.
    """
    data = {"image_base64": streetlight_base64, "category_hint": "STREETLIGHT"}
    response = await client.post("/predict", data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["category"] == "STREETLIGHT"
    assert res_data["severity_score"] >= 0.10
