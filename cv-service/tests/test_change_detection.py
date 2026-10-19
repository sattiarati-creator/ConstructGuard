import pytest
import numpy as np
import cv2
from app.change_detection.differ import ChangeDiffer

@pytest.fixture
def differ():
    return ChangeDiffer(
        min_contour_area=200.0,
        low_threshold=5.0,
        medium_threshold=15.0,
        high_threshold=35.0,
    )

def test_no_change_images(differ):
    # Two identical gray canvases
    img1 = np.full((400, 400, 3), 150, dtype=np.uint8)
    img2 = img1.copy()

    pct, level, regions, _ = differ.compare(img1, img2)
    assert pct == 0.0
    assert level == "LOW"
    assert len(regions) == 0

def test_small_change_image(differ):
    img1 = np.full((400, 400, 3), 150, dtype=np.uint8)
    img2 = img1.copy()
    # Draw a moderate altered box (e.g. 50x50 = 2500 px > 200 min_contour_area)
    cv2.rectangle(img2, (100, 100), (150, 150), (0, 0, 0), -1)

    pct, level, regions, _ = differ.compare(img1, img2)
    assert pct > 0.0
    assert len(regions) >= 1
    assert level in ["LOW", "MEDIUM"]

def test_significant_change_image(differ):
    img1 = np.full((400, 400, 3), 200, dtype=np.uint8)
    img2 = img1.copy()
    # Draw a massive altered section covering >40% of the image
    cv2.rectangle(img2, (50, 50), (350, 350), (10, 10, 10), -1)

    pct, level, regions, _ = differ.compare(img1, img2)
    assert pct >= 35.0
    assert level in ["HIGH", "CRITICAL"]
    assert len(regions) >= 1

def test_multiple_changed_regions(differ):
    img1 = np.full((500, 500, 3), 180, dtype=np.uint8)
    img2 = img1.copy()
    # Draw 3 separated changed rectangles
    cv2.rectangle(img2, (50, 50), (120, 120), (20, 20, 20), -1)
    cv2.rectangle(img2, (200, 200), (280, 280), (20, 20, 20), -1)
    cv2.rectangle(img2, (350, 350), (450, 450), (20, 20, 20), -1)

    pct, level, regions, _ = differ.compare(img1, img2)
    assert len(regions) == 3
    # Check that regions are sorted by area descending
    assert regions[0].area >= regions[1].area >= regions[2].area

def test_noise_contour_area_filtering():
    # Strict differ requiring min 1000 px area
    strict_differ = ChangeDiffer(min_contour_area=1000.0)
    img1 = np.full((400, 400, 3), 150, dtype=np.uint8)
    img2 = img1.copy()

    # Draw tiny noise speckle (e.g. 10x10 = 100 px < 1000)
    cv2.rectangle(img2, (50, 50), (60, 60), (0, 0, 0), -1)
    # Draw large altered feature (100x100 = 10,000 px > 1000)
    cv2.rectangle(img2, (200, 200), (300, 300), (0, 0, 0), -1)

    pct, level, regions, _ = strict_differ.compare(img1, img2)
    # The tiny speckle should be filtered out
    assert len(regions) == 1
    assert regions[0].area >= 1000.0
