import cv2
import numpy as np
from typing import Tuple

def prepare_images_for_diff(
    prev_img: np.ndarray,
    curr_img: np.ndarray,
    target_size: Tuple[int, int] = (640, 640),
    blur_kernel: Tuple[int, int] = (21, 21),
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Standardizes two images for frame differential analysis:
    1. Resizes both images to an identical spatial resolution.
    2. Converts to single-channel 8-bit grayscale.
    3. Applies Gaussian Blur to suppress sensor noise and environmental micro-variations.
    
    Returns:
        Tuple of (blurred_prev_gray, blurred_curr_gray).
    """
    # 1. Resize to common resolution
    prev_resized = cv2.resize(prev_img, target_size, interpolation=cv2.INTER_AREA)
    curr_resized = cv2.resize(curr_img, target_size, interpolation=cv2.INTER_AREA)

    # 2. Convert to grayscale
    prev_gray = cv2.cvtColor(prev_resized, cv2.COLOR_BGR2GRAY)
    curr_gray = cv2.cvtColor(curr_resized, cv2.COLOR_BGR2GRAY)

    # 3. Gaussian Blur (kernel must have positive odd dimensions)
    blur_prev = cv2.GaussianBlur(prev_gray, blur_kernel, 0)
    blur_curr = cv2.GaussianBlur(curr_gray, blur_kernel, 0)

    return blur_prev, blur_curr
