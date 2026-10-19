import pytest
import numpy as np
from app.detection.models import Detection, BoundingBox, DetectionResponse
from app.detection.postprocessing import (
    filter_detections_by_confidence,
    categorize_construction_objects,
)
from app.detection.detector import Detector

def test_confidence_filtering():
    detections = [
        Detection(
            **{
                "class": "truck",
                "confidence": 0.85,
                "bounding_box": BoundingBox(x=10, y=20, width=50, height=50),
            }
        ),
        Detection(
            **{
                "class": "person",
                "confidence": 0.35,
                "bounding_box": BoundingBox(x=100, y=100, width=30, height=80),
            }
        ),
        Detection(
            **{
                "class": "car",
                "confidence": 0.42,
                "bounding_box": BoundingBox(x=200, y=150, width=80, height=40),
            }
        ),
    ]

    filtered = filter_detections_by_confidence(detections, threshold=0.40)
    assert len(filtered) == 2
    assert {d.class_name for d in filtered} == {"truck", "car"}

def test_categorize_construction_objects():
    detections = [
        Detection(
            **{
                "class": "excavator",
                "confidence": 0.91,
                "bounding_box": BoundingBox(x=50, y=50, width=200, height=150),
            }
        ),
        Detection(
            **{
                "class": "dog",
                "confidence": 0.88,
                "bounding_box": BoundingBox(x=300, y=300, width=40, height=40),
            }
        ),
    ]

    matched, indicators = categorize_construction_objects(detections)
    assert len(matched) == 1
    assert matched[0].class_name == "excavator"
    assert any("excavator" in ind.lower() for ind in indicators)

def test_detector_schema_response():
    resp = DetectionResponse(
        success=True,
        detections=[
            Detection(
                **{
                    "class": "person",
                    "confidence": 0.92,
                    "bounding_box": BoundingBox(x=100, y=120, width=80, height=180),
                }
            )
        ],
        inference_time_ms=45.2,
        image_width=640,
        image_height=640,
    )
    json_data = resp.model_dump(by_alias=True)
    assert json_data["success"] is True
    assert json_data["detections"][0]["class"] == "person"
    assert json_data["detections"][0]["confidence"] == 0.92
    assert "inference_time_ms" in json_data

def test_detector_execution_on_blank_frame():
    detector = Detector()
    test_img = np.zeros((640, 640, 3), dtype=np.uint8)
    detections, duration_ms = detector.detect(test_img)
    assert isinstance(detections, list)
    assert duration_ms >= 0.0
