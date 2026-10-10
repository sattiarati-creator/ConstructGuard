import logging
from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import JSONResponse

from app.change_detection.differ import ChangeDiffer
from app.change_detection.models import ChangeDetectionResponse
from app.utils.image_utils import validate_and_read_upload, ImageValidationError
from app.config.settings import settings

logger = logging.getLogger("constructguard.api.change")

router = APIRouter(prefix="/api/v1", tags=["Change Detection"])

def get_differ() -> ChangeDiffer:
    from app.main import app_state
    if "differ" not in app_state:
        app_state["differ"] = ChangeDiffer()
    return app_state["differ"]

@router.post("/change-detection", response_model=ChangeDetectionResponse)
async def detect_changes(
    previous_image: UploadFile = File(..., description="Prior baseline site image"),
    current_image: UploadFile = File(..., description="Current observation site image"),
    differ: ChangeDiffer = Depends(get_differ),
):
    """
    Compares two temporal site frames using OpenCV morphological and difference pipelines.
    Quantifies pixel delta percentage and identifies significant altered regions.
    """
    logger.info(f"Received change detection request: '{previous_image.filename}' vs '{current_image.filename}'")

    try:
        prev_arr, prev_w, prev_h = await validate_and_read_upload(
            previous_image, max_size_mb=settings.MAX_IMAGE_SIZE_MB
        )
        curr_arr, curr_w, curr_h = await validate_and_read_upload(
            current_image, max_size_mb=settings.MAX_IMAGE_SIZE_MB
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
        logger.error(f"Unexpected error in change detection decoding: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An error occurred while comparing images.",
                },
            },
        )

    logger.debug(f"Both images decoded successfully ({prev_w}x{prev_h} & {curr_w}x{curr_h}). Running diff...")
    pct, level, regions, duration_ms = differ.compare(prev_arr, curr_arr)
    logger.info(
        f"Change comparison completed in {duration_ms}ms: {pct}% delta ({level}) with {len(regions)} significant regions."
    )

    return ChangeDetectionResponse(
        success=True,
        change_percentage=pct,
        change_level=level,
        changed_regions=regions,
        processing_time_ms=duration_ms,
    )
