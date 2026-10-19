import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import JSONResponse

from app.services.analysis_service import AnalysisService, AnalysisResponse
from app.utils.image_utils import validate_and_read_upload, ImageValidationError
from app.config.settings import settings

logger = logging.getLogger("constructguard.api.analysis")

router = APIRouter(prefix="/api/v1", tags=["Multi-Signal Analysis"])

def get_analysis_service() -> AnalysisService:
    from app.main import app_state
    if "analysis_service" not in app_state:
        from app.detection.detector import Detector
        from app.change_detection.differ import ChangeDiffer
        detector = app_state.get("detector") or Detector()
        differ = app_state.get("differ") or ChangeDiffer()
        app_state["analysis_service"] = AnalysisService(detector, differ)
    return app_state["analysis_service"]

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_scene(
    current_image: UploadFile = File(..., description="Current observation image"),
    previous_image: Optional[UploadFile] = File(None, description="Optional previous observation for change delta"),
    service: AnalysisService = Depends(get_analysis_service),
):
    """
    Combines YOLO object detection and OpenCV change analysis into an aggregated
    construction activity score with actionable evidence indicators.
    """
    logger.info(f"Received multi-modal analysis request for: '{current_image.filename}'")

    try:
        curr_arr, _, _ = await validate_and_read_upload(
            current_image, max_size_mb=settings.MAX_IMAGE_SIZE_MB
        )
    except ImageValidationError as e:
        logger.warning(f"Current image validation failed: {e.code} - {e.message}")
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
        logger.error(f"Unexpected error in current image decoding: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An error occurred while processing the current image.",
                },
            },
        )

    prev_arr = None
    if previous_image is not None and previous_image.filename:
        try:
            prev_arr, _, _ = await validate_and_read_upload(
                previous_image, max_size_mb=settings.MAX_IMAGE_SIZE_MB
            )
            logger.debug("Prior baseline image decoded successfully for delta calculation.")
        except ImageValidationError as e:
            logger.warning(f"Prior image validation failed: {e.code} - {e.message}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "success": False,
                    "error": {
                        "code": f"PREVIOUS_{e.code}",
                        "message": f"Previous image error: {e.message}",
                    },
                },
            )

    response = service.analyze(curr_img=curr_arr, prev_img=prev_arr)
    logger.info(
        f"Analysis complete: score={response.construction_activity_score}, change={response.change_score}%, time={response.inference_time_ms}ms"
    )

    return response
