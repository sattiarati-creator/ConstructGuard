# ConstructGuard IoT Telemetry Simulator

Realistic construction-site IoT sensor telemetry generator that publishes time-series readings to an Eclipse Mosquitto MQTT broker.

---

## Features

- **5 Sensor Streams**:
  - `vibration` (3-axis seismic acceleration, normal: 0.05–0.25 g, anomaly: 0.70–1.20 g)
  - `noise` (acoustic decibel pressure, normal: 40–65 dB, anomaly: 80–110 dB)
  - `motion` (perimeter microwave/PIR detection, 0.0 = idle, 1.0 = motion detected)
  - `temperature` (exhaust/ambient heat, normal: 20–35 °C, anomaly: 45–60 °C)
  - `dust` (PM10 particulate concentration, normal: 10–40 µg/m³, anomaly: 70–150 µg/m³)
- **Standardized MQTT Topic Hierarchy**: `constructguard/sites/{site_id}/sensors/{sensor_type}`
- **Multi-Site Emulation**: Out-of-the-box support for `site-101`, `site-102`, `site-103`, `site-104`, `site-105`
- **Configurable Anomaly Injection**: Controllable via `ANOMALY_PROBABILITY` (default 10%)
- **Automatic Reconnection & Resilience**: Backoff retry handling against broker downtime

---

## Configuration (`.env`)

```env
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
PUBLISH_INTERVAL_SECONDS=5
ANOMALY_PROBABILITY=0.10
SITE_IDS=site-101,site-102,site-103,site-104,site-105
```

---

## Running the Simulator

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Continuous Telemetry Dispatch
```bash
python src/main.py
```

### 3. CLI Override Flags
```bash
# Run against a specific site with 20% anomaly probability and 2-second interval
python src/main.py --broker localhost --port 1883 --sites site-101 --anomaly-prob 0.20 --interval 2

# Run a single cycle for integration testing
python src/main.py --once
```

### 4. Run Pytest Suite
```bash
pytest
```
