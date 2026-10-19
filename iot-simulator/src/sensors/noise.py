import random
from typing import Tuple
from .base import BaseSensor


class NoiseSensor(BaseSensor):
    """
    Measures acoustic decibel pressure levels (in dB).
    Normal range: 30 - 70 dB (simulated: 40 - 65 dB)
    Anomalous demolition / heavy construction: 80 - 110 dB
    """
    def __init__(self, site_id: str, sensor_id: str = "noise-001", anomaly_probability: float = 0.10):
        super().__init__(
            site_id=site_id,
            sensor_id=sensor_id,
            sensor_type="noise",
            unit="dB",
            anomaly_probability=anomaly_probability,
        )

    def sample(self, force_anomaly: bool = False) -> Tuple[float, bool]:
        is_anomaly = force_anomaly or (random.random() < self.anomaly_probability)
        if is_anomaly:
            # Anomalous generator, jackhammer, or heavy equipment sound
            value = random.uniform(80.0, 110.0)
        else:
            # Normal ambient environmental sound level
            value = random.uniform(40.0, 65.0)
        return value, is_anomaly
