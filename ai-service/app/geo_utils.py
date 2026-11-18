"""
Geospatial and mathematical utility functions for CivicConnect AI microservice.
Implements the Haversine formula for spherical distance and cosine similarity
for high-dimensional visual feature vectors.
"""

import math
from typing import List, Sequence


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates using the Haversine formula.
    
    Why:
    The earth is modeled as a sphere of mean radius 6,371,000 meters. For municipal
    proximity checks (<50m), Haversine provides millimeter-grade relative accuracy
    with minimal computational overhead compared to expensive ellipsoidal geodesics.
    """
    # Earth's mean radius in meters
    radius_earth_meters = 6371000.0

    # Convert coordinates from decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine central angle formula
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    # Clamp 'a' to [0.0, 1.0] to guard against floating-point precision domain errors in asin
    a = max(0.0, min(1.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(radius_earth_meters * c, 2)


def cosine_similarity(vec1: Sequence[float], vec2: Sequence[float]) -> float:
    """
    Calculates cosine similarity between two feature vectors: cos(theta) = (u . v) / (||u|| * ||v||).
    
    Why:
    Deep and classical computer vision embeddings represent semantic scene characteristics
    independent of scalar intensity scaling. Cosine similarity measures directional alignment
    in feature space, ranging from -1.0 to 1.0 (or 0.0 to 1.0 for non-negative histograms).
    """
    if not vec1 or not vec2:
        return 0.0
    
    if len(vec1) != len(vec2):
        # Truncate to the common prefix length if dimension mismatch occurs
        common_len = min(len(vec1), len(vec2))
        vec1 = vec1[:common_len]
        vec2 = vec2[:common_len]

    dot_product = 0.0
    norm_a_sq = 0.0
    norm_b_sq = 0.0

    for a, b in zip(vec1, vec2):
        dot_product += a * b
        norm_a_sq += a * a
        norm_b_sq += b * b

    norm_a = math.sqrt(norm_a_sq)
    norm_b = math.sqrt(norm_b_sq)

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    sim = dot_product / (norm_a * norm_b)
    # Clamp to [-1.0, 1.0] to prevent floating point inaccuracies
    return float(max(-1.0, min(1.0, round(sim, 4))))
