# ConstructGuard Computer Vision Microservice 👁️

High-performance visual perception microservice combining Ultralytics YOLO deep learning object detection with OpenCV frame differential change analysis.

---

## 🚀 Key Capabilities

1. **Object Detection**: Identifies heavy machinery, transport vehicles, and site workers using Ultralytics YOLO (`yolo11n.pt` / `yolov8n.pt` or custom weights) loaded **once** at server startup.
2. **Structural Change Detection**: Compares temporal frame pairs using Gaussian blur, absolute differencing, binary thresholding, and morphological operations to calculate altered pixel percentages while ignoring environmental noise.
3. **Multi-Signal Scene Analysis**: Fuses object detection with visual change delta into a normalized construction activity score (0–100) with explainable evidence indicators.
4. **Resilient API Architecture**: Enforces strict file validation (empty payload, corrupted header, dimension bounds) with consistent error responses without leaking Python stack traces.

---

## 🛠️ Local Development Setup

### 1. Create and Activate Virtual Environment
```powershell
cd cv-service
python -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\activate
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables
```powershell
cp .env.example .env
```

### 4. Run the FastAPI Server
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger Documentation is accessible at:
- `http://localhost:8000/docs`

---

## 🧪 Testing & Benchmarking

### Run the Pytest Test Suite
```powershell
pytest -v
```

### Run Performance Latency & Throughput Benchmark
```powershell
python benchmarks/benchmark_detection.py --iterations 20 --warmup 3
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service operational health check |
| `POST` | `/api/v1/detect` | Single-frame object detection |
| `POST` | `/api/v1/change-detection` | Temporal frame-pair change detection |
| `POST` | `/api/v1/analyze` | Combined multi-signal analysis |
