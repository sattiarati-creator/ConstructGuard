import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.detection.detector import Detector
from app.detection.models import DetectionResponse
from app.utils.image_utils import validate_and_read_upload, ImageValidationError
from app.config.settings import settings

logger = logging.getLogger("constructguard.api.detection")

router = APIRouter(prefix="/api/v1", tags=["Object Detection"])

# Dependency provider for detector (injected from app state)
def get_detector() -> Detector:
    from app.main import app_state
    if "detector" not in app_state:
        app_state["detector"] = Detector()
    return app_state["detector"]

@router.post("/detect", response_model=DetectionResponse)
async def detect_objects(
    image: UploadFile = File(..., description="Site camera image file (JPEG, PNG, WebP)"),
    detector: Detector = Depends(get_detector),
):
    """
    Executes deep learning object detection on a single uploaded camera frame.
    Identifies vehicles, machinery, workers, and returns bounding boxes with confidence scores.
    """
    logger.info(f"Received detection request for file: '{image.filename}'")
    
    try:
        img_arr, width, height = await validate_and_read_upload(
            image, max_size_mb=settings.MAX_IMAGE_SIZE_MB
        )
    except ImageValidationError as e:
        logger.warning(f"Image validation failed: {e.code} - {e.message}")
        return JSONResponse(
            status_code=e.status_code,
            content={
                "success": False,
                "error": {
                    "code": e.code,
                    "message": e.message,
                },
            },
        )
    except Exception as e:
        logger.error(f"Unexpected error processing image upload: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An error occurred while processing the image.",
                },
            },
        )

    logger.debug(f"Image decoded successfully ({width}x{height}). Running inference...")
    detections, inference_time_ms = detector.detect(img_arr)
    logger.info(f"Inference completed in {inference_time_ms}ms with {len(detections)} detections.")

    return DetectionResponse(
        success=True,
        detections=detections,
        inference_time_ms=inference_time_ms,
        image_width=width,
        image_height=height,
    )
