import os
import sys
import argparse
import logging
import signal
from dotenv import load_dotenv

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.mqtt.publisher import MQTTPublisher
from src.simulator.engine import SimulationEngine

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ConstructGuard.IoT")


def parse_args():
    parser = argparse.ArgumentParser(description="ConstructGuard IoT Perimeter Telemetry Simulator")
    parser.add_argument("--broker", type=str, default=os.getenv("MQTT_BROKER", "localhost"), help="MQTT broker host")
    parser.add_argument("--port", type=int, default=int(os.getenv("MQTT_PORT", "1883")), help="MQTT broker port")
    parser.add_argument("--interval", type=int, default=int(os.getenv("PUBLISH_INTERVAL_SECONDS", "5")), help="Publish cycle interval in seconds")
    parser.add_argument("--anomaly-prob", type=float, default=float(os.getenv("ANOMALY_PROBABILITY", "0.10")), help="Anomaly probability (0.0 to 1.0)")
    parser.add_argument("--sites", type=str, default=os.getenv("SITE_IDS", "site-101,site-102,site-103,site-104,site-105"), help="Comma-separated site IDs")
    parser.add_argument("--once", action="store_true", help="Execute single cycle and exit (useful for testing/CI)")
    return parser.parse_args()


def main():
    args = parse_args()
    site_list = [s.strip() for s in args.sites.split(",") if s.strip()]

    username = os.getenv("MQTT_USERNAME") or None
    password = os.getenv("MQTT_PASSWORD") or None

    logger.info("=" * 60)
    logger.info(" ConstructGuard Smart Construction Monitoring - IoT Simulator")
    logger.info(" Broker: %s:%d", args.broker, args.port)
    logger.info(" Monitored Sites: %s", ", ".join(site_list))
    logger.info(" Publish Interval: %d seconds", args.interval)
    logger.info(" Configured Anomaly Probability: %.1f%%", args.anomaly_prob * 100)
    logger.info("=" * 60)

    publisher = MQTTPublisher(
        broker=args.broker,
        port=args.port,
        username=username,
        password=password,
    )
    publisher.connect()

    engine = SimulationEngine(
        publisher=publisher,
        site_ids=site_list,
        interval_seconds=args.interval,
        anomaly_probability=args.anomaly_prob,
    )

    def handle_signal(sig, frame):
        logger.info("Received interrupt signal (%s). Gracefully exiting...", sig)
        engine.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    if args.once:
        logger.info("Executing single test cycle...")
        count = engine.run_cycle()
        logger.info("Single cycle completed with %d messages sent.", count)
        publisher.disconnect()
    else:
        engine.start()


if __name__ == "__main__":
    main()
