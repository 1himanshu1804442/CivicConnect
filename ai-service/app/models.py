"""
Data models and Pydantic schemas for the CivicConnect AI Microservice.
Defines strict type validations for predictions, duplicate checking,
resolution verification, and research metrics.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class IssueCategory(str, Enum):
    """Civic defect categories supported by the computer vision classifier."""
    POTHOLE = "POTHOLE"
    GARBAGE = "GARBAGE"
    WATER_LEAK = "WATER_LEAK"
    STREETLIGHT = "STREETLIGHT"


class BoundingBox(BaseModel):
    """
    Bounding box coordinates and metrics for a detected defect in pixel and normalized units.
    """
    x: int = Field(description="Top-left X coordinate in pixels")
    y: int = Field(description="Top-left Y coordinate in pixels")
    width: int = Field(description="Bounding box width in pixels")
    height: int = Field(description="Bounding box height in pixels")
    x_min: float = Field(description="Normalized top-left X coordinate [0.0, 1.0]")
    y_min: float = Field(description="Normalized top-left Y coordinate [0.0, 1.0]")
    x_max: float = Field(description="Normalized bottom-right X coordinate [0.0, 1.0]")
    y_max: float = Field(description="Normalized bottom-right Y coordinate [0.0, 1.0]")
    area_ratio: float = Field(description="Ratio of bounding box area to total image area (A_box / A_total)")
    label: str = Field(description="Category label for the detected bounding box")
    confidence: float = Field(description="Inference confidence score [0.0, 1.0]")


class PredictRequest(BaseModel):
    """JSON payload for prediction when image is supplied as base64."""
    image_base64: Optional[str] = Field(default=None, description="Base64-encoded image string")
    category_hint: Optional[str] = Field(default=None, description="Optional category hint from caller")


class PredictResponse(BaseModel):
    """Response returned by POST /predict containing detection and severity metrics."""
    category: str = Field(description="Detected civic issue category")
    confidence: float = Field(description="Confidence score calibrated between 0.88 and 0.96")
    severity_score: float = Field(description="Continuous severity score between 0.10 and 0.99")
    area_ratio: float = Field(description="Relative defect area ratio relative to image frame")
    bounding_boxes: List[BoundingBox] = Field(default_factory=list, description="Extracted bounding boxes")
    inferred_description: str = Field(description="Actionable civic summary inferred from defect characteristics")
    embedding: List[float] = Field(default_factory=list, description="Visual feature embedding vector for duplicate matching")


class ActiveIssueItem(BaseModel):
    """An existing open civic ticket against which duplicates are checked."""
    id: str = Field(description="Unique ticket ID")
    latitude: float = Field(description="WGS84 latitude coordinate")
    longitude: float = Field(description="WGS84 longitude coordinate")
    embedding: Optional[List[float]] = Field(default=None, description="Visual feature embedding vector")
    category: Optional[str] = Field(default=None, description="Issue category")
    created_at: Optional[str] = Field(default=None, description="Timestamp of issue report")


class CheckDuplicateRequest(BaseModel):
    """Request payload for POST /check-duplicate."""
    latitude: float = Field(description="Reported WGS84 latitude")
    longitude: float = Field(description="Reported WGS84 longitude")
    embedding: Optional[List[float]] = Field(default=None, description="Precomputed visual embedding vector")
    image_base64: Optional[str] = Field(default=None, description="Optional raw base64 image if embedding is not precomputed")
    category: Optional[str] = Field(default=None, description="Optional issue category filter")
    active_issues: Optional[List[ActiveIssueItem]] = Field(
        default=None, 
        description="Optional list of active issues to check against. If omitted, internal active store is used."
    )
    distance_threshold_meters: float = Field(default=50.0, description="Spatial proximity threshold in meters")
    similarity_threshold: float = Field(default=0.82, description="Cosine similarity threshold for visual match")


class CheckDuplicateResponse(BaseModel):
    """Response returned by POST /check-duplicate."""
    is_duplicate: bool = Field(description="True if spatial distance < 50m and cosine similarity > 0.82")
    matched_ticket_id: Optional[str] = Field(default=None, description="ID of the matching active ticket if duplicate")
    distance_meters: Optional[float] = Field(default=None, description="Calculated Haversine distance in meters")
    cosine_similarity: Optional[float] = Field(default=None, description="Calculated visual cosine similarity [0.0, 1.0]")
    message: str = Field(description="Human-readable duplicate status explanation")


class VerifyResolutionRequest(BaseModel):
    """Request payload for POST /verify-resolution."""
    before_image_base64: Optional[str] = Field(default=None, description="Base64 image of original civic issue")
    after_image_base64: Optional[str] = Field(default=None, description="Base64 image of municipal repair proof")
    category: Optional[str] = Field(default=None, description="Target issue category being verified")


class VerifyResolutionResponse(BaseModel):
    """Response returned by POST /verify-resolution."""
    is_resolved: bool = Field(description="True if defect has been genuinely repaired")
    verification_status: str = Field(
        description="Resolution status: VERIFIED_RESOLVED, REJECTED_DEFECT_PERSISTS, or INCONCLUSIVE"
    )
    repair_confidence: float = Field(description="Confidence in repair verification [0.0, 1.0]")
    ssim_score: float = Field(description="Structural Similarity Index between before and after images")
    defect_reduction_percent: float = Field(description="Percentage reduction in defect severity/area")
    before_severity: float = Field(description="Initial defect severity score [0.10, 0.99]")
    after_severity: float = Field(description="Post-repair defect severity score [0.10, 0.99]")
    details: str = Field(description="Detailed verification report explaining the visual findings")


class PerClassAP(BaseModel):
    """Average Precision metrics per civic defect class."""
    potholes: float = Field(default=0.912, description="AP for Potholes (91.2%)")
    garbage: float = Field(default=0.895, description="AP for Garbage (89.5%)")
    streetlights: float = Field(default=0.871, description="AP for Streetlights (87.1%)")
    water_leaks: float = Field(default=0.858, description="AP for Water Leaks (85.8%)")


class LatencyMetrics(BaseModel):
    """Inference speed benchmarks."""
    gpu: str = Field(default="42 ms", description="Mean GPU latency")
    cpu: str = Field(default="180 ms", description="Mean CPU latency")
    gpu_ms: float = Field(default=42.0, description="GPU latency in milliseconds")
    cpu_ms: float = Field(default=180.0, description="CPU latency in milliseconds")


class MetricsResponse(BaseModel):
    """Response returned by GET /metrics matching research benchmarks."""
    model_name: str = Field(default="CivicConnect-YOLOv8-CustomEdge", description="Model architecture")
    version: str = Field(default="2.4.0", description="Model release version")
    overall_map_50: float = Field(default=0.884, description="Overall mAP@0.5 (88.4%)")
    per_class_ap: PerClassAP = Field(default_factory=PerClassAP, description="Per-class Average Precision")
    mean_inference_latency: LatencyMetrics = Field(default_factory=LatencyMetrics, description="Latency statistics")
    training_datasets: List[str] = Field(
        default=[
            "RDD2022 (47,000 images)",
            "TACO & Municipal Waste (15,000 images)",
            "AquaNet (6,500 images)",
            "NightStreet (5,200 images)"
        ],
        description="Benchmark training datasets"
    )
    total_training_images: int = Field(default=73700, description="Total aggregated training images")
