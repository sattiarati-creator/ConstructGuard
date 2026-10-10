# ConstructGuard Test Suite

This repository features structured testing across all microservices:

1. **Backend Tests (`backend/tests/`)**:
   - Framework: **Jest** + **Supertest**
   - Commands:
     ```bash
     cd backend
     npm test
     ```
   - Covers: Health check, API routes, middleware, and BullMQ queues.

2. **Computer Vision Microservice Tests (`cv-service/tests/`)**:
   - Framework: **Pytest** + **FastAPI TestClient**
   - Commands:
     ```bash
     cd cv-service
     pytest
     ```
   - Covers: Image decoding, resolution validation, YOLO detection outputs, and OpenCV frame differential thresholds.

3. **IoT Sensor Simulator Tests (`iot-simulator/tests/`)**:
   - Framework: **Pytest**
   - Commands:
     ```bash
     cd iot-simulator
     pytest
     ```
   - Covers: Sensor value generation ranges and anomaly injection.
