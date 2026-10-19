import pytest
import numpy as np
import cv2
from app.utils.image_utils import (
    decode_image_bytes,
    ImageValidationError,
    resize_to_common,
)

def test_valid_image_decoding():
    # Create valid synthetic BGR image
    img = np.full((100, 100, 3), 128, dtype=np.uint8)
    _, encoded = cv2.imencode(".jpg", img)
    raw_bytes = encoded.tobytes()

    decoded = decode_image_bytes(raw_bytes)
    assert isinstance(decoded, np.ndarray)
    assert decoded.shape == (100, 100, 3)

def test_empty_image_upload_raises():
    with pytest.raises(ImageValidationError) as exc_info:
        decode_image_bytes(b"")
    assert exc_info.value.code == "EMPTY_IMAGE"

def test_corrupted_image_raises():
    with pytest.raises(ImageValidationError) as exc_info:
        decode_image_bytes(b"NOT_A_VALID_IMAGE_HEADER_DATA")
    assert exc_info.value.code == "INVALID_IMAGE"

def test_invalid_image_dimensions_raises():
    # 8x8 image is below the 16x16 minimum bound
    tiny_img = np.zeros((8, 8, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".png", tiny_img)
    raw_bytes = encoded.tobytes()

    with pytest.raises(ImageValidationError) as exc_info:
        decode_image_bytes(raw_bytes, min_dim=16)
    assert exc_info.value.code == "INVALID_DIMENSIONS"

def test_resize_to_common():
    img = np.zeros((300, 500, 3), dtype=np.uint8)
    resized = resize_to_common(img, target_size=(640, 640))
    assert resized.shape == (640, 640, 3)
