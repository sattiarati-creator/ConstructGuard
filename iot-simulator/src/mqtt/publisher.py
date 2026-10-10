import json
import logging
import time
from typing import Dict, Any, Optional
import paho.mqtt.client as mqtt

from .topics import build_sensor_topic

logger = logging.getLogger("ConstructGuard.IoT.Publisher")


class MQTTPublisher:
    """
    Resilient MQTT publisher client with automatic reconnect handling and telemetry publishing.
    """
    def __init__(
        self,
        broker: str = "localhost",
        port: int = 1883,
        client_id: str = "constructguard-iot-sim",
        username: Optional[str] = None,
        password: Optional[str] = None,
    ):
        self.broker = broker
        self.port = port
        self.client_id = client_id
        self.username = username
        self.password = password
        self.client: Optional[mqtt.Client] = None
        self.is_connected = False
        self._reconnect_attempts = 0

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.is_connected = True
            self._reconnect_attempts = 0
            logger.info("Connected successfully to MQTT broker at %s:%s", self.broker, self.port)
        else:
            logger.warning("MQTT connection failed with result code: %s", rc)

    def _on_disconnect(self, client, userdata, rc, properties=None):
        self.is_connected = False
        logger.warning(
            "Disconnected from MQTT broker (rc=%s). Automatic background reconnection active.",
            rc,
        )

    def connect(self) -> None:
        try:
            # Paho MQTT v2 API compatibility
            self.client = mqtt.Client(
                mqtt.CallbackAPIVersion.VERSION2,
                client_id=f"{self.client_id}-{int(time.time())}",
            )
        except AttributeError:
            # Fallback for Paho MQTT v1
            self.client = mqtt.Client(client_id=f"{self.client_id}-{int(time.time())}")

        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        # Set automatic reconnect delay backoff
        self.client.reconnect_delay_set(min_delay=1, max_delay=30)

        logger.info("Connecting to MQTT broker at %s:%s...", self.broker, self.port)
        try:
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            logger.warning("Initial connection error: %s. Reconnection will proceed in loop.", e)

    def publish_reading(self, payload: Dict[str, Any], is_anomaly: bool = False) -> bool:
        """
        Publishes sensor payload to standard topic.
        Logs site, sensor, value, topic, and anomaly status clearly.
        """
        site_id = payload.get("site_id", "unknown")
        sensor_type = payload.get("sensor_type", "unknown")
        sensor_id = payload.get("sensor_id", "unknown")
        value = payload.get("value")
        unit = payload.get("unit", "")

        topic = build_sensor_topic(site_id, sensor_type)
        message_str = json.dumps(payload)

        status_tag = "ANOMALOUS" if is_anomaly else "NORMAL"

        if not self.client:
            logger.error("MQTT client is uninitialized. Cannot publish reading.")
            return False

        try:
            result = self.client.publish(topic, message_str, qos=1)
            is_success = result.rc == mqtt.MQTT_ERR_SUCCESS
            if is_success:
                logger.info(
                    "[%s] Site: %s | Sensor: %s (%s) | Value: %s %s | Topic: %s",
                    status_tag,
                    site_id,
                    sensor_id,
                    sensor_type,
                    value,
                    unit,
                    topic,
                )
            else:
                logger.error("Failed to publish message to topic %s (code: %s)", topic, result.rc)
            return is_success
        except Exception as e:
            logger.error("Exception during MQTT publish to %s: %s", topic, e)
            return False

    def disconnect(self) -> None:
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            self.is_connected = False
            logger.info("Disconnected cleanly from MQTT broker.")
