import io
import cv2
import numpy as np
from PIL import Image
from typing import Tuple
from fastapi import UploadFile, HTTPException

class ImageValidationError(Exception):
    """Custom exception for image decoding and validation failures."""
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
}

def decode_image_bytes(image_bytes: bytes, min_dim: int = 16) -> np.ndarray:
    """
    Decodes raw image bytes into an OpenCV BGR NumPy array with validation.
    
    Raises:
        ImageValidationError: If the byte buffer is empty, corrupted, or dimensionally invalid.
    """
    if not image_bytes or len(image_bytes) == 0:
        raise ImageValidationError(
            code="EMPTY_IMAGE",
            message="Uploaded image payload is empty.",
            status_code=400,
        )

    # Decode using OpenCV from byte buffer
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        # Fallback decode with Pillow if OpenCV fails on esoteric headers
        try:
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        except Exception:
            raise ImageValidationError(
                code="INVALID_IMAGE",
                message="Unable to decode uploaded image. Format may be corrupted or unsupported.",
                status_code=400,
            )

    height, width = image.shape[:2]
    if height < min_dim or width < min_dim:
        raise ImageValidationError(
            code="INVALID_DIMENSIONS",
            message=f"Image dimensions ({width}x{height}) are smaller than minimum required ({min_dim}x{min_dim}).",
            status_code=400,
        )

    return image

async def validate_and_read_upload(upload_file: UploadFile, max_size_mb: float = 15.0) -> Tuple[np.ndarray, int, int]:
    """
    Validates file upload metadata, reads bytes, and returns decoded (image, width, height).
    """
    if not upload_file or not upload_file.filename:
        raise ImageValidationError(
            code="MISSING_FILE",
            message="No file was uploaded.",
            status_code=400,
        )

    content_type = upload_file.content_type
    if content_type and content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise ImageValidationError(
            code="UNSUPPORTED_TYPE",
            message=f"Content type '{content_type}' is not supported. Use JPEG, PNG, or WebP.",
            status_code=400,
        )

    # Read binary contents
    file_bytes = await upload_file.read()
    max_bytes = int(max_size_mb * 1024 * 1024)

    if len(file_bytes) > max_bytes:
        raise ImageValidationError(
            code="FILE_TOO_LARGE",
            message=f"File exceeds maximum allowed size of {max_size_mb} MB.",
            status_code=413,
        )

    image = decode_image_bytes(file_bytes)
    height, width = image.shape[:2]
    return image, width, height

def resize_to_common(img: np.ndarray, target_size: Tuple[int, int] = (640, 640)) -> np.ndarray:
    """Resizes image to standard dimensions for differential analysis."""
    return cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)
