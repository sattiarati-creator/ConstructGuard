"""
Base sensor abstract class for ConstructGuard IoT Telemetry Simulator.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from datetime import datetime, timezone
import random


class BaseSensor(ABC):
    """
    Abstract sensor representation responsible for generating realistic
    telemetry with configurable anomaly injection for unauthorized construction risk evaluation.
    """
    def __init__(
        self,
        site_id: str,
        sensor_id: str,
        sensor_type: str,
        unit: str,
        anomaly_probability: float = 0.10,
    ):
        self.site_id = site_id
        self.sensor_id = sensor_id
        self.sensor_type = sensor_type
        self.unit = unit
        self.anomaly_probability = anomaly_probability

    @abstractmethod
    def sample(self, force_anomaly: bool = False) -> Tuple[float, bool]:
        """
        Samples a new sensor reading.
        Returns:
            Tuple of (numeric_value, is_anomalous_boolean)
        """
        pass

    def generate_reading(self, force_anomaly: bool = False) -> Tuple[Dict[str, Any], bool]:
        """
        Generates standard telemetry payload and returns (payload, is_anomaly).
        The payload conforms strictly to the ConstructGuard IoT MQTT specification.
        """
        value, is_anomaly = self.sample(force_anomaly=force_anomaly)
        payload = {
            "site_id": self.site_id,
            "sensor_id": self.sensor_id,
            "sensor_type": self.sensor_type,
            "value": round(value, 2),
            "unit": self.unit,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return payload, is_anomaly
