import random
from typing import Tuple
from .base import BaseSensor


class VibrationSensor(BaseSensor):
    """
    Measures 3-axis seismic vibration / acceleration (in g-force).
    Normal range: 0.0 - 0.30 g (simulated: 0.05 - 0.25 g)
    Anomalous heavy excavation / demolition: 0.70 - 1.20 g
    """
    def __init__(self, site_id: str, sensor_id: str = "vib-001", anomaly_probability: float = 0.10):
        super().__init__(
            site_id=site_id,
            sensor_id=sensor_id,
            sensor_type="vibration",
            unit="g",
            anomaly_probability=anomaly_probability,
        )

    def sample(self, force_anomaly: bool = False) -> Tuple[float, bool]:
        is_anomaly = force_anomaly or (random.random() < self.anomaly_probability)
        if is_anomaly:
            # Anomalous heavy machinery vibration
            value = random.uniform(0.70, 1.20)
        else:
            # Baseline ambient / ground vibration
            value = random.uniform(0.05, 0.25)
        return value, is_anomaly
