import io
import pytest
import numpy as np
import cv2
from fastapi.testclient import TestClient

from app.main import app
from app.services.analysis_service import AnalysisService
from app.detection.detector import Detector
from app.change_detection.differ import ChangeDiffer

client = TestClient(app)

def create_encoded_jpeg(color: int = 120, w: int = 200, h: int = 200) -> bytes:
    img = np.full((h, w, 3), color, dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "constructguard-cv"

def test_missing_previous_image_in_service():
    detector = Detector()
    differ = ChangeDiffer()
    service = AnalysisService(detector, differ)

    curr_img = np.full((400, 400, 3), 100, dtype=np.uint8)
    # Call analyze with prev_img=None
    res = service.analyze(curr_img=curr_img, prev_img=None)
    assert res.success is True
    assert res.change_score == 0.0
    assert any("single image" in ind.lower() for ind in res.risk_indicators)

def test_combined_analysis_in_service():
    detector = Detector()
    differ = ChangeDiffer()
    service = AnalysisService(detector, differ)

    prev_img = np.full((400, 400, 3), 150, dtype=np.uint8)
    curr_img = prev_img.copy()
    cv2.rectangle(curr_img, (100, 100), (300, 300), (0, 0, 0), -1)

    res = service.analyze(curr_img=curr_img, prev_img=prev_img)
    assert res.success is True
    assert res.change_score > 0.0
    assert res.construction_activity_score >= 0.0

def test_detect_endpoint_valid_image():
    raw_bytes = create_encoded_jpeg(150, 300, 300)
    files = {"image": ("test.jpg", io.BytesIO(raw_bytes), "image/jpeg")}
    res = client.post("/api/v1/detect", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "detections" in data
    assert data["image_width"] == 300
    assert data["image_height"] == 300

def test_detect_endpoint_empty_file_rejected():
    files = {"image": ("empty.jpg", io.BytesIO(b""), "image/jpeg")}
    res = client.post("/api/v1/detect", files=files)
    assert res.status_code == 400
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "EMPTY_IMAGE"

def test_change_detection_endpoint():
    prev_bytes = create_encoded_jpeg(150, 200, 200)
    curr_bytes = create_encoded_jpeg(200, 200, 200)
    files = {
        "previous_image": ("prev.jpg", io.BytesIO(prev_bytes), "image/jpeg"),
        "current_image": ("curr.jpg", io.BytesIO(curr_bytes), "image/jpeg"),
    }
    res = client.post("/api/v1/change-detection", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "change_percentage" in data
    assert "change_level" in data
    assert "processing_time_ms" in data

def test_analyze_endpoint_single_and_paired():
    curr_bytes = create_encoded_jpeg(150, 200, 200)
    prev_bytes = create_encoded_jpeg(100, 200, 200)

    # 1. Single image
    files_single = {"current_image": ("curr.jpg", io.BytesIO(curr_bytes), "image/jpeg")}
    res_single = client.post("/api/v1/analyze", files=files_single)
    assert res_single.status_code == 200
    assert res_single.json()["success"] is True

    # 2. Paired images
    files_paired = {
        "current_image": ("curr.jpg", io.BytesIO(curr_bytes), "image/jpeg"),
        "previous_image": ("prev.jpg", io.BytesIO(prev_bytes), "image/jpeg"),
    }
    res_paired = client.post("/api/v1/analyze", files=files_paired)
    assert res_paired.status_code == 200
    data = res_paired.json()
    assert data["success"] is True
    assert "construction_activity_score" in data
    assert "risk_indicators" in data
