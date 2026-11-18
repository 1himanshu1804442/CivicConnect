"""
CivicConnect Computer Vision AI Microservice.
FastAPI application entrypoint with CORS middleware, health probes,
and defect detection routes.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("civicconnect.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager for startup and shutdown lifecycle events.
    """
    logger.info("Initializing CivicConnect Computer Vision AI Microservice...")
    logger.info("OpenCV acceleration and model evaluation metrics loaded.")
    yield
    logger.info("Shutting down CivicConnect AI Microservice.")


# Initialize FastAPI application
app = FastAPI(
    title="CivicConnect AI Microservice",
    description=(
        "Production AI microservice for civic issue detection (POTHOLE, GARBAGE, "
        "WATER_LEAK, STREETLIGHT), spatial-visual duplicate detection, and municipal "
        "repair verification using OpenCV edge density, gradient variance, and SSIM."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS middleware
# Why: Enables CivicConnect React frontend and Spring Boot backend to interact
# with this AI microservice without browser cross-origin policy blockage.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core computer vision routes
app.include_router(router)


@app.get("/health", tags=["System"])
async def health_check():
    """Service health probe endpoint."""
    return {
        "status": "UP",
        "service": "CivicConnect-AI-Service",
        "engine": "OpenCV-PyTorch-Hybrid"
    }


if __name__ == "__main__":
    import uvicorn
    # Run uvicorn server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
