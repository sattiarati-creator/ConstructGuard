"""
ConstructGuard MQTT Topics Module.
Centralizes MQTT topic creation and parsing for IoT sensor telemetry.
"""
from typing import Optional, Dict


def build_sensor_topic(site_id: str, sensor_type: str, prefix: str = "constructguard") -> str:
    """
    Builds standard hierarchical MQTT topic:
    {prefix}/sites/{site_id}/sensors/{sensor_type}
    
    Example: constructguard/sites/site-101/sensors/vibration
    """
    clean_prefix = prefix.strip("/")
    clean_site = site_id.strip("/")
    clean_type = sensor_type.strip("/")
    return f"{clean_prefix}/sites/{clean_site}/sensors/{clean_type}"


def parse_sensor_topic(topic: str) -> Optional[Dict[str, str]]:
    """
    Parses a sensor telemetry topic into its components:
    Returns dict with keys: 'prefix', 'site_id', 'sensor_type' or None if invalid.
    """
    parts = topic.strip("/").split("/")
    if len(parts) == 5 and parts[1] == "sites" and parts[3] == "sensors":
        return {
            "prefix": parts[0],
            "site_id": parts[2],
            "sensor_type": parts[4],
        }
    return None
