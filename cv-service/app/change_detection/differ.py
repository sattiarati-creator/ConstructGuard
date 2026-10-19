import time
import logging
import cv2
import numpy as np
from typing import List, Tuple, Optional
from .models import ChangedRegion, ChangeDetectionResponse
from .preprocessing import prepare_images_for_diff
from app.config.settings import settings

logger = logging.getLogger("constructguard.change_detection")

class ChangeDiffer:
    """
    OpenCV-based structural change detection engine.
    Analyzes temporal frame pairs to calculate pixel alteration percentage
    and identifies significant altered bounding regions while ignoring noise.
    """
    def __init__(
        self,
        min_contour_area: Optional[float] = None,
        low_threshold: Optional[float] = None,
        medium_threshold: Optional[float] = None,
        high_threshold: Optional[float] = None,
        pixel_diff_threshold: int = 30,
        morph_iterations: int = 2,
    ):
        self.min_contour_area = min_contour_area if min_contour_area is not None else settings.MIN_CONTOUR_AREA
        self.low_threshold = low_threshold if low_threshold is not None else settings.LOW_CHANGE_THRESHOLD
        self.medium_threshold = medium_threshold if medium_threshold is not None else settings.MEDIUM_CHANGE_THRESHOLD
        self.high_threshold = high_threshold if high_threshold is not None else settings.HIGH_CHANGE_THRESHOLD
        self.pixel_diff_threshold = pixel_diff_threshold
        self.morph_iterations = morph_iterations

    def compare(
        self,
        prev_img: np.ndarray,
        curr_img: np.ndarray,
    ) -> Tuple[float, str, List[ChangedRegion], float]:
        """
        Executes the structural difference pipeline on two images.
        
        Returns:
            Tuple of (change_percentage, change_level, changed_regions, processing_time_ms)
        """
        start_time = time.perf_counter()

        # 1. Preprocessing: resize, grayscale, Gaussian blur
        blur_prev, blur_curr = prepare_images_for_diff(prev_img, curr_img)

        # 2. Absolute Difference
        frame_diff = cv2.absdiff(blur_prev, blur_curr)

        # 3. Binary Thresholding
        _, thresh = cv2.threshold(
            frame_diff,
            self.pixel_diff_threshold,
            255,
            cv2.THRESH_BINARY,
        )

        # 4. Morphological Dilation to fuse fragmented edges into coherent regions
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        dilated = cv2.dilate(thresh, kernel, iterations=self.morph_iterations)

        # 5. Calculate altered pixel percentage across entire frame
        total_pixels = dilated.shape[0] * dilated.shape[1]
        changed_pixels = int(np.count_nonzero(dilated))
        change_percentage = round((changed_pixels / total_pixels) * 100.0, 2)

        # 6. Extract Connected Contours
        contours, _ = cv2.findContours(
            dilated,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        # 7. Filter Contours by minimum area (suppressing foliage, shadow flickers, sensor noise)
        changed_regions: List[ChangedRegion] = []
        for c in contours:
            area = cv2.contourArea(c)
            if area >= self.min_contour_area:
                x, y, w, h = cv2.boundingRect(c)
                changed_regions.append(
                    ChangedRegion(
                        x=int(x),
                        y=int(y),
                        width=int(w),
                        height=int(h),
                        area=round(float(area), 1),
                    )
                )

        # Sort changed regions by area descending (largest physical change first)
        changed_regions.sort(key=lambda r: r.area, reverse=True)

        # 8. Classify Change Severity Level
        if change_percentage > self.high_threshold:
            change_level = "CRITICAL"
        elif change_percentage >= self.medium_threshold:
            change_level = "HIGH"
        elif change_percentage >= self.low_threshold:
            change_level = "MEDIUM"
        else:
            change_level = "LOW"

        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return change_percentage, change_level, changed_regions, duration_ms
