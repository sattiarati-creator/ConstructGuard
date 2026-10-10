import random
from typing import Tuple
from .base import BaseSensor


class TemperatureSensor(BaseSensor):
    """
    Measures ambient / engine perimeter temperature (in Celsius).
    Normal range: 15 - 40 C (simulated: 20 - 35 C)
    Anomalous running diesel exhaust / continuous engine load: 45 - 60 C
    """
    def __init__(self, site_id: str, sensor_id: str = "temp-001", anomaly_probability: float = 0.10):
        super().__init__(
            site_id=site_id,
            sensor_id=sensor_id,
            sensor_type="temperature",
            unit="C",
            anomaly_probability=anomaly_probability,
        )

    def sample(self, force_anomaly: bool = False) -> Tuple[float, bool]:
        is_anomaly = force_anomaly or (random.random() < self.anomaly_probability)
        if is_anomaly:
            # Anomalous equipment exhaust or intensive heat source
            value = random.uniform(45.0, 60.0)
        else:
            # Normal ambient daytime temperature
            value = random.uniform(20.0, 35.0)
        return value, is_anomaly
