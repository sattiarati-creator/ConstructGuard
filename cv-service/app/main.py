import logging
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.detection.detector import Detector
from app.change_detection.differ import ChangeDiffer
from app.services.analysis_service import AnalysisService
from app.api.routes_detection import router as detection_router
from app.api.routes_change import router as change_router
from app.api.routes_analysis import router as analysis_router
from app.utils.image_utils import ImageValidationError

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
)
logger = logging.getLogger("constructguard.main")

# Global state container for single-instance services
app_state: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager:
    Loads Ultralytics YOLO model and OpenCV engine ONCE during startup.
    Ensures model weights are never re-instantiated per incoming request.
    """
    logger.info("=" * 60)
    logger.info(" ConstructGuard Computer Vision Microservice Starting Up")
    logger.info(f" Model: '{settings.MODEL_NAME}' | Confidence: {settings.CONFIDENCE_THRESHOLD}")
    logger.info(f" Min Contour Area: {settings.MIN_CONTOUR_AREA} | Max Upload: {settings.MAX_IMAGE_SIZE_MB}MB")
    logger.info("=" * 60)

    # Instantiate single detector instance
    detector = Detector(
        model_name=settings.MODEL_NAME,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        image_size=settings.IMAGE_SIZE,
    )
    change_differ = ChangeDiffer(
        min_contour_area=settings.MIN_CONTOUR_AREA,
        low_threshold=settings.LOW_CHANGE_THRESHOLD,
        medium_threshold=settings.MEDIUM_CHANGE_THRESHOLD,
        high_threshold=settings.HIGH_CHANGE_THRESHOLD,
    )
    analysis_service = AnalysisService(detector=detector, change_differ=change_differ)

    app_state["detector"] = detector
    app_state["differ"] = change_differ
    app_state["analysis_service"] = analysis_service

    yield

    # Clean shutdown
    logger.info("Shutting down ConstructGuard Computer Vision Microservice...")
    app_state.clear()
    logger.info("Cleanup complete.")

app = FastAPI(
    title="ConstructGuard Computer Vision Microservice",
    description="High-performance CV microservice combining Ultralytics YOLO object detection with OpenCV frame differential change analysis.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers ensuring no raw stack traces leak to HTTP clients
@app.exception_handler(ImageValidationError)
async def image_validation_exception_handler(request: Request, exc: ImageValidationError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
            },
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
            },
        },
    )

# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Returns microservice operational status."""
    return {
        "status": "healthy",
        "service": "constructguard-cv",
    }

# Mount subrouters
app.include_router(detection_router)
app.include_router(change_router)
app.include_router(analysis_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
