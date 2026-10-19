import random
from typing import Tuple
from .base import BaseSensor


class MotionSensor(BaseSensor):
    """
    Measures PIR / microwave perimeter motion (0.0 = idle, 1.0 = motion detected).
    Normal state: mostly idle (0.0), occasionally true (1.0).
    Anomalous intrusion / unauthorized night work: continuous movement (1.0).
    """
    def __init__(self, site_id: str, sensor_id: str = "motion-001", anomaly_probability: float = 0.10):
        super().__init__(
            site_id=site_id,
            sensor_id=sensor_id,
            sensor_type="motion",
            unit="state",
            anomaly_probability=anomaly_probability,
        )

    def sample(self, force_anomaly: bool = False) -> Tuple[float, bool]:
        is_anomaly = force_anomaly or (random.random() < self.anomaly_probability)
        if is_anomaly:
            # Frequent/continuous active movement detected
            return 1.0, True
        else:
            # Baseline: mostly 0.0, occasional passive trip (5% chance)
            is_active = random.random() < 0.05
            return (1.0 if is_active else 0.0), False
