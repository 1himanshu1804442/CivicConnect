import os
import sys

# Ensure ai-service root and tests are in sys.path
ai_root = r"C:\Users\hy180\Projects\civic-connect\ai-service"
sys.path.insert(0, ai_root)
sys.path.insert(0, os.path.join(ai_root, "tests"))

from conftest import (
    create_synthetic_pothole_image,
    create_synthetic_repaired_image,
    create_synthetic_garbage_image,
    create_synthetic_water_leak_image,
    create_synthetic_streetlight_image,
)

destinations = [
    os.path.join(ai_root, "demo_photos"),
    r"C:\Users\hy180\Downloads\demo_photos",
    r"C:\Users\hy180\Downloads\CivicConnect\demo_photos"
]

samples = {
    "1_pothole_defect.jpg": create_synthetic_pothole_image(),
    "2_pothole_repaired_after.jpg": create_synthetic_repaired_image(),
    "3_garbage_overflow.jpg": create_synthetic_garbage_image(),
    "4_water_leak_burst.jpg": create_synthetic_water_leak_image(),
    "5_streetlight_outage.jpg": create_synthetic_streetlight_image(),
}

for dest in destinations:
    os.makedirs(dest, exist_ok=True)
    for filename, img_bytes in samples.items():
        file_path = os.path.join(dest, filename)
        with open(file_path, "wb") as f:
            f.write(img_bytes)
        print(f"Generated: {file_path} ({len(img_bytes)} bytes)")

print("\nSuccessfully generated all 5 synthetic demo images across all folders!")
