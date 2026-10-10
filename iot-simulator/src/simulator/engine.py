import logging
import time
from typing import List
from src.sensors.base import BaseSensor
from src.sensors.vibration import VibrationSensor
from src.sensors.noise import NoiseSensor
from src.sensors.motion import MotionSensor
from src.sensors.dust import DustSensor
from src.sensors.temperature import TemperatureSensor
from src.mqtt.publisher import MQTTPublisher

logger = logging.getLogger("ConstructGuard.IoT.Engine")


class SimulationEngine:
    """
    Simulates multi-site IoT perimeter deployments.
    Generates background telemetry cycles with configurable anomalies across multiple construction sites.
    """
    def __init__(
        self,
        publisher: MQTTPublisher,
        site_ids: List[str],
        interval_seconds: int = 5,
        anomaly_probability: float = 0.10,
    ):
        self.publisher = publisher
        self.site_ids = site_ids
        self.interval_seconds = interval_seconds
        self.anomaly_probability = anomaly_probability
        self.sensors: List[BaseSensor] = []
        self._is_running = False
        self._init_sensor_fleet()

    def _init_sensor_fleet(self) -> None:
        self.sensors.clear()
        for site_id in self.site_ids:
            # Generate deterministic, clean sensor IDs per site
            suffix = site_id.replace("site-", "")
            self.sensors.extend([
                VibrationSensor(site_id=site_id, sensor_id=f"vib-{suffix}", anomaly_probability=self.anomaly_probability),
                NoiseSensor(site_id=site_id, sensor_id=f"noise-{suffix}", anomaly_probability=self.anomaly_probability),
                MotionSensor(site_id=site_id, sensor_id=f"motion-{suffix}", anomaly_probability=self.anomaly_probability),
                DustSensor(site_id=site_id, sensor_id=f"dust-{suffix}", anomaly_probability=self.anomaly_probability),
                TemperatureSensor(site_id=site_id, sensor_id=f"temp-{suffix}", anomaly_probability=self.anomaly_probability),
            ])

    def run_cycle(self, force_anomaly: bool = False) -> int:
        """
        Executes one full sweep across all registered sensors in all monitored sites.
        Returns the number of successfully published telemetry messages.
        """
        published_count = 0
        for sensor in self.sensors:
            payload, is_anomaly = sensor.generate_reading(force_anomaly=force_anomaly)
            if self.publisher.publish_reading(payload, is_anomaly=is_anomaly):
                published_count += 1
        return published_count

    def start(self) -> None:
        self._is_running = True
        logger.info(
            "Starting IoT simulation engine across %d sites (%d total sensors).",
            len(self.site_ids),
            len(self.sensors),
        )
        logger.info("Cycle interval: %ds | Base anomaly rate: %.0f%%", self.interval_seconds, self.anomaly_probability * 100)

        try:
            while self._is_running:
                dispatched = self.run_cycle()
                logger.info("Cycle complete: dispatched %d/%d sensor readings.", dispatched, len(self.sensors))
                time.sleep(self.interval_seconds)
        except KeyboardInterrupt:
            self.stop()

    def stop(self) -> None:
        self._is_running = False
        logger.info("Stopping simulation engine...")
        self.publisher.disconnect()
