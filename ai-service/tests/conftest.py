"""
Pytest configuration and synthetic civic image fixtures for CivicConnect AI tests.
"""

import sys
import os
import base64
import io
import pytest
import pytest_asyncio
import numpy as np
import cv2
from PIL import Image
import httpx

# Ensure ai-service root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app


def create_synthetic_pothole_image() -> bytes:
    """
    Creates a synthetic road image with an irregular dark pothole cavity
    having sharp, jagged rim edges and textured asphalt background.
    """
    # 300x300 grey road surface with grain noise
    np.random.seed(42)
    road = np.full((300, 300, 3), 110, dtype=np.uint8)
    noise = np.random.randint(-20, 20, (300, 300, 3), dtype=np.int16)
    road = np.clip(road.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Dark pothole depression in center with jagged edges
    cv2.ellipse(road, (150, 150), (60, 40), 20, 0, 360, (35, 35, 35), -1)
    # Add harsh irregular rim cracks
    cv2.polylines(road, [np.array([[90, 140], [80, 160], [100, 175], [140, 195], [200, 185], [215, 145], [180, 120], [120, 130]])], True, (15, 15, 15), 3)

    _, buffer = cv2.imencode(".jpg", road)
    return buffer.tobytes()


def create_synthetic_repaired_image() -> bytes:
    """
    Creates a synthetic repaired asphalt road image matching the scene
    background of the pothole image, but with the cavity filled smoothly.
    """
    np.random.seed(42)
    road = np.full((300, 300, 3), 110, dtype=np.uint8)
    noise = np.random.randint(-15, 15, (300, 300, 3), dtype=np.int16)
    road = np.clip(road.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Fresh smooth patch with slight contrast but zero jagged cracks
    cv2.ellipse(road, (150, 150), (65, 45), 20, 0, 360, (105, 105, 105), -1)

    _, buffer = cv2.imencode(".jpg", road)
    return buffer.tobytes()


def create_synthetic_garbage_image() -> bytes:
    """
    Creates a synthetic image with scattered multi-colored refuse debris
    (red, yellow, blue, green plastic packages) on pavement.
    """
    np.random.seed(99)
    ground = np.full((300, 300, 3), 130, dtype=np.uint8)

    # Colored waste blobs with high hue entropy
    cv2.rectangle(ground, (80, 90), (140, 160), (0, 0, 220), -1)     # Red plastic
    cv2.rectangle(ground, (150, 120), (220, 180), (0, 210, 220), -1)  # Yellow carton
    cv2.circle(ground, (130, 210), 35, (220, 120, 0), -1)             # Blue bottle
    cv2.circle(ground, (190, 80), 25, (0, 180, 0), -1)                # Green wrapper

    _, buffer = cv2.imencode(".jpg", ground)
    return buffer.tobytes()


def create_synthetic_water_leak_image() -> bytes:
    """
    Creates a synthetic image representing surface water logging with cyan puddle hues
    and high specular reflections.
    """
    np.random.seed(7)
    road = np.full((300, 300, 3), 90, dtype=np.uint8)

    # Cyan/blue saturated water puddle
    cv2.ellipse(road, (150, 150), (80, 50), 0, 0, 360, (190, 150, 40), -1)  # BGR cyan
    # Specular white reflection highlight
    cv2.ellipse(road, (140, 140), (40, 15), -15, 0, 360, (245, 245, 245), -1)

    _, buffer = cv2.imencode(".jpg", road)
    return buffer.tobytes()


def create_synthetic_streetlight_image() -> bytes:
    """
    Creates a synthetic nocturnal scene with low ambient illumination
    and dark road with a distant malfunctioning luminaire.
    """
    # Low ambient brightness (< 40)
    night = np.full((300, 300, 3), 25, dtype=np.uint8)
    # Pole silhouette
    cv2.line(night, (150, 300), (150, 80), (10, 10, 10), 6)
    # Small unlit / dim luminaire
    cv2.circle(night, (150, 75), 12, (180, 180, 120), -1)

    _, buffer = cv2.imencode(".jpg", night)
    return buffer.tobytes()


@pytest.fixture
def pothole_bytes() -> bytes:
    return create_synthetic_pothole_image()


@pytest.fixture
def pothole_base64(pothole_bytes) -> str:
    return base64.b64encode(pothole_bytes).decode("utf-8")


@pytest.fixture
def repaired_pothole_bytes() -> bytes:
    return create_synthetic_repaired_image()


@pytest.fixture
def repaired_pothole_base64(repaired_pothole_bytes) -> str:
    return base64.b64encode(repaired_pothole_bytes).decode("utf-8")


@pytest.fixture
def garbage_bytes() -> bytes:
    return create_synthetic_garbage_image()


@pytest.fixture
def garbage_base64(garbage_bytes) -> str:
    return base64.b64encode(garbage_bytes).decode("utf-8")


@pytest.fixture
def water_leak_bytes() -> bytes:
    return create_synthetic_water_leak_image()


@pytest.fixture
def water_leak_base64(water_leak_bytes) -> str:
    return base64.b64encode(water_leak_bytes).decode("utf-8")


@pytest.fixture
def streetlight_bytes() -> bytes:
    return create_synthetic_streetlight_image()


@pytest.fixture
def streetlight_base64(streetlight_bytes) -> str:
    return base64.b64encode(streetlight_bytes).decode("utf-8")


@pytest_asyncio.fixture
async def client():
    """Async HTTP test client bound directly to the FastAPI app via ASGITransport."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
