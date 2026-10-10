# ConstructGuard Technical Interview Preparation Guide

This guide is designed for senior engineering interviews, system design discussions, and architectural walkthroughs.

---

## 1. The 2-Minute Elevator Pitch

> "ConstructGuard is an enterprise IoT and Computer Vision risk intelligence platform designed to detect indicators of potentially unauthorized construction and prioritize high-risk sites for human inspection.
> 
> The core pipeline ingests edge camera frames and IoT sensor streams across municipal zones. High-resolution frames are evaluated by a Python microservice combining YOLOv11 for heavy machinery detection and OpenCV for structural image differencing. Concurrently, environmental and vibration sensor readings are ingested via Eclipse Mosquitto MQTT.
> 
> Instead of an unpredictable LLM, ConstructGuard relies on a **deterministic, explainable, and configurable 5-factor risk engine** that scores visual machinery, image change, vibration/noise anomalies, permitted time windows, and permit status. High-risk evaluations trigger BullMQ background jobs, persist to PostgreSQL 16, emit real-time Socket.IO alerts to human inspectors, and render on an interactive React Leaflet dashboard.
> 
> The key principle is that the system provides **decision support, not legal enforcement**, maintaining full explainability and immutable audit trails for municipal inspectors."

---

## 2. The 5-Minute In-Depth Architectural Walkthrough

### Part 1: Ingestion & Edge Tier
"At the edge, RTSP cameras capture optical feeds and edge microcontrollers publish vibration, noise, dust, and temperature readings over MQTT. MQTT was selected for its ultra-low bandwidth overhead and QoS guarantees over unreliable cellular connections on remote construction sites."

### Part 2: Asynchronous Event-Driven Decoupling
"Rather than blocking HTTP requests during heavy computer vision inference, camera frames enter a Redis-backed BullMQ priority queue. A Python FastAPI worker runs Ultralytics YOLOv11 and OpenCV frame subtraction. By loading the YOLO weights once into memory during startup and separating CV compute from the core Node.js API, the system scales CV workers independently on GPU nodes."

### Part 3: The Deterministic Risk Engine
"We intentionally rejected using an LLM as the core decision maker. In municipal and regulatory enforcement, decision makers require 100% deterministic, explainable, and testable risk calculations. We built a weighted multi-factor engine:
- Visual Detection Score (30%)
- Image Change Detection Score (25%)
- IoT Sensor Anomalies (20%)
- Time Window & Curfew Compliance (15%)
- Permit Validity (10%)
Every single score calculation outputs an explicit arithmetic breakdown and human-readable indicator tags."

### Part 4: State Persistence & Triage Dispatch
"Evaluations are stored in PostgreSQL 16 using UUIDs and JSONB for bounding boxes and change masks. If a score exceeds the threshold (&ge;80 for Critical, &ge;60 for High), the system idempotently dispatches an Operator Alert. WebSockets push live alerts to the React 18 dashboard where human inspectors can inspect the dual-frame difference, review live sensor telemetry, acknowledge the incident, or resolve it with mandatory audit notes."

---

## 3. High-Frequency Interview Questions & Master Answers

### Q1: Why not use a Large Language Model (LLM) or Vision-Language Model as the core decision maker?
**Answer:**
1. **Explainability & Auditing**: A municipal court or regulatory body cannot accept a black-box LLM hallucinating why a construction site was deemed unauthorized. ConstructGuard's formula is `Overall = 0.3*V + 0.25*C + 0.2*S + 0.15*T + 0.1*P`. Every point is mathematically auditable.
2. **Determinism**: The exact same telemetry must always yield the exact same risk score across time.
3. **Latency & Cost**: Evaluating 100 cameras at 1 frame per minute with a commercial multimodal LLM costs thousands of dollars monthly and adds 2-5 second latency per frame. YOLOv11 + OpenCV processes in &lt;50ms at zero API cost.
4. **Legal Liability**: As stated throughout our architecture, ConstructGuard detects indicators and prioritizes sites for human inspection; it does not claim legal enforcement.

### Q2: Why BullMQ + Redis instead of Apache Kafka?
**Answer:**
For the scale of tens to thousands of construction sites, Kafka introduces massive operational overhead (ZooKeeper/KRaft, JVM tuning, partitions). BullMQ with Redis 7 provides native exponential backoff, job deduplication, rate limiting, and dead-letter queues out of the box with microsecond latency and negligible operational complexity. If the system scales to city-wide 100,000+ continuous streams, Kafka can easily be swapped in as the upstream buffer.

### Q3: Why PostgreSQL over TimeScaleDB or MongoDB?
**Answer:**
ConstructGuard's primary queries require strong relational integrity (sites have cameras, cameras have images, images have detections, risk events generate alerts, users acknowledge alerts). PostgreSQL 16 provides standard ACID guarantees, excellent JSONB support for detection masks, and composite indexing (`site_id, sensor_type, timestamp DESC`) that easily handles millions of sensor rows with single-digit millisecond query times. If sensor volume grows into billions, PostgreSQL table partitioning or the TimescaleDB extension can be enabled with zero application code changes.

### Q4: How does the system handle network dropouts or camera disconnection?
**Answer:**
1. **MQTT QoS 1**: Sensor readings are buffered at the edge gateway and retried until Mosquitto acknowledges receipt.
2. **Camera Heartbeat**: Cameras update `last_seen_at`. If no frame is received within 5 minutes, camera status switches to `OFFLINE` and an operator notification is triggered to investigate camera tampering or power failure.
3. **Graceful Scoring Degradation**: If camera feeds are offline, the risk engine scales the remaining available components (Sensor, Time, Permit) so the site remains actively monitored.

### Q5: How do you prevent duplicate alerts from overwhelming operators?
**Answer:**
Alert deduplication is built into `alertService.ts`. Before creating an alert, the engine checks for unresolved existing alerts (`status IN ('OPEN', 'ACKNOWLEDGED')`) for the same risk event or site within a configurable cooling window. New events update the existing alert record rather than flooding the operator queue.
