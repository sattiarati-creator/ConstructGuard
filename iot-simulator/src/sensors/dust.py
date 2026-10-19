import random
from typing import Tuple
from .base import BaseSensor


class DustSensor(BaseSensor):
    """
    Measures particulate concentration PM10 / PM2.5 (in ug/m3).
    Normal range: 0 - 50 ug/m3 (simulated: 10 - 40 ug/m3)
    Anomalous earthmoving / unsuppressed demolition dust: 70 - 150 ug/m3
    """
    def __init__(self, site_id: str, sensor_id: str = "dust-001", anomaly_probability: float = 0.10):
        super().__init__(
            site_id=site_id,
            sensor_id=sensor_id,
            sensor_type="dust",
            unit="ug/m3",
            anomaly_probability=anomaly_probability,
        )

    def sample(self, force_anomaly: bool = False) -> Tuple[float, bool]:
        is_anomaly = force_anomaly or (random.random() < self.anomaly_probability)
        if is_anomaly:
            # Anomalous particulate levels from excavation or demolition
            value = random.uniform(70.0, 150.0)
        else:
            # Normal baseline ambient air quality
            value = random.uniform(10.0, 40.0)
        return value, is_anomaly
