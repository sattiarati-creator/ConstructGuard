import pytest
from datetime import datetime
from src.sensors.vibration import VibrationSensor
from src.sensors.noise import NoiseSensor
from src.sensors.motion import MotionSensor
from src.sensors.dust import DustSensor
from src.sensors.temperature import TemperatureSensor
from src.mqtt.topics import build_sensor_topic, parse_sensor_topic
from src.simulator.engine import SimulationEngine


def test_vibration_sensor_normal_and_anomaly():
    sensor = VibrationSensor(site_id="site-101", sensor_id="vib-001", anomaly_probability=0.0)
    reading, is_anomaly = sensor.generate_reading(force_anomaly=False)
    
    assert reading["site_id"] == "site-101"
    assert reading["sensor_id"] == "vib-001"
    assert reading["sensor_type"] == "vibration"
    assert reading["unit"] == "g"
    assert 0.05 <= reading["value"] <= 0.25
    assert is_anomaly is False

    # Force anomaly
    anom_reading, anom_flag = sensor.generate_reading(force_anomaly=True)
    assert 0.70 <= anom_reading["value"] <= 1.20
    assert anom_flag is True


def test_noise_sensor_normal_and_anomaly():
    sensor = NoiseSensor(site_id="site-102", sensor_id="noise-002", anomaly_probability=0.0)
    reading, is_anomaly = sensor.generate_reading(force_anomaly=False)

    assert reading["site_id"] == "site-102"
    assert reading["sensor_id"] == "noise-002"
    assert reading["sensor_type"] == "noise"
    assert reading["unit"] == "dB"
    assert 40.0 <= reading["value"] <= 65.0
    assert is_anomaly is False

    # Force anomaly
    anom_reading, anom_flag = sensor.generate_reading(force_anomaly=True)
    assert 80.0 <= anom_reading["value"] <= 110.0
    assert anom_flag is True


def test_dust_sensor_normal_and_anomaly():
    sensor = DustSensor(site_id="site-103", sensor_id="dust-003", anomaly_probability=0.0)
    reading, is_anomaly = sensor.generate_reading(force_anomaly=False)

    assert reading["site_id"] == "site-103"
    assert reading["sensor_id"] == "dust-003"
    assert reading["sensor_type"] == "dust"
    assert reading["unit"] == "ug/m3"
    assert 10.0 <= reading["value"] <= 40.0
    assert is_anomaly is False

    # Force anomaly
    anom_reading, anom_flag = sensor.generate_reading(force_anomaly=True)
    assert 70.0 <= anom_reading["value"] <= 150.0
    assert anom_flag is True


def test_temperature_sensor_normal_and_anomaly():
    sensor = TemperatureSensor(site_id="site-104", sensor_id="temp-004", anomaly_probability=0.0)
    reading, is_anomaly = sensor.generate_reading(force_anomaly=False)

    assert reading["site_id"] == "site-104"
    assert reading["sensor_id"] == "temp-004"
    assert reading["sensor_type"] == "temperature"
    assert reading["unit"] == "C"
    assert 20.0 <= reading["value"] <= 35.0
    assert is_anomaly is False

    # Force anomaly
    anom_reading, anom_flag = sensor.generate_reading(force_anomaly=True)
    assert 45.0 <= anom_reading["value"] <= 60.0
    assert anom_flag is True


def test_motion_sensor_states():
    sensor = MotionSensor(site_id="site-105", sensor_id="motion-005")
    reading, _ = sensor.generate_reading(force_anomaly=False)

    assert reading["site_id"] == "site-105"
    assert reading["sensor_id"] == "motion-005"
    assert reading["sensor_type"] == "motion"
    assert reading["unit"] == "state"
    assert reading["value"] in [0.0, 1.0]

    # Force anomaly (continuous active motion)
    anom_reading, anom_flag = sensor.generate_reading(force_anomaly=True)
    assert anom_reading["value"] == 1.0
    assert anom_flag is True


def test_iso_timestamp_formatting():
    sensor = VibrationSensor("site-101")
    reading, _ = sensor.generate_reading()
    # Check that ISO-8601 parses without throwing ValueError
    dt = datetime.fromisoformat(reading["timestamp"])
    assert dt is not None


def test_topic_builder_and_parser():
    topic = build_sensor_topic("site-101", "vibration")
    assert topic == "constructguard/sites/site-101/sensors/vibration"

    parsed = parse_sensor_topic(topic)
    assert parsed is not None
    assert parsed["prefix"] == "constructguard"
    assert parsed["site_id"] == "site-101"
    assert parsed["sensor_type"] == "vibration"

    invalid_parsed = parse_sensor_topic("invalid/topic/format")
    assert invalid_parsed is None


def test_simulation_engine_initialization():
    class DummyPublisher:
        def __init__(self):
            self.published = []
        def publish_reading(self, payload, is_anomaly=False):
            self.published.append((payload, is_anomaly))
            return True
        def disconnect(self):
            pass

    dummy_pub = DummyPublisher()
    sites = ["site-101", "site-102"]
    engine = SimulationEngine(publisher=dummy_pub, site_ids=sites, interval_seconds=1, anomaly_probability=0.2)

    # 2 sites * 5 sensors = 10 sensors
    assert len(engine.sensors) == 10

    count = engine.run_cycle()
    assert count == 10
    assert len(dummy_pub.published) == 10
