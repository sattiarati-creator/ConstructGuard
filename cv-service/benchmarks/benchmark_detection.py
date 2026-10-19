import time
import argparse
import numpy as np
import cv2
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.detection.detector import Detector
from app.change_detection.differ import ChangeDiffer
from app.services.analysis_service import AnalysisService

def create_synthetic_frame(width: int = 640, height: int = 640, add_noise: bool = False) -> np.ndarray:
    """Generates a synthetic construction scene image for benchmarking."""
    img = np.full((height, width, 3), 120, dtype=np.uint8)
    # Draw simulated ground / dirt
    cv2.rectangle(img, (0, int(height * 0.6)), (width, height), (34, 60, 90), -1)
    # Draw simulated building structure
    cv2.rectangle(img, (100, 150), (450, int(height * 0.6)), (180, 180, 180), -1)
    # Draw simulated machinery / vehicle block
    cv2.rectangle(img, (200, 300), (380, 420), (0, 165, 255), -1)

    if add_noise:
        noise = np.random.normal(0, 15, img.shape).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    return img

def run_benchmark(num_iterations: int = 20, warmup: int = 3):
    print("=" * 65)
    print(" ConstructGuard Computer Vision Microservice Benchmark")
    print(f" Target Iterations: {num_iterations} (Warmup: {warmup})")
    print("=" * 65)

    print("[1/3] Initializing Detector and ChangeDiffer...")
    detector = Detector()
    differ = ChangeDiffer()
    analysis_service = AnalysisService(detector=detector, change_differ=differ)

    sample_frame_1 = create_synthetic_frame(640, 640, add_noise=False)
    sample_frame_2 = create_synthetic_frame(640, 640, add_noise=True)

    print(f"[2/3] Performing {warmup} warmup iterations...")
    for _ in range(warmup):
        analysis_service.analyze(curr_img=sample_frame_1, prev_img=sample_frame_2)

    print(f"[3/3] Running benchmark over {num_iterations} iterations...")
    inference_times_ms = []
    t_start_total = time.perf_counter()

    for i in range(num_iterations):
        t0 = time.perf_counter()
        res = analysis_service.analyze(curr_img=sample_frame_2, prev_img=sample_frame_1)
        latency_ms = (time.perf_counter() - t0) * 1000.0
        inference_times_ms.append(latency_ms)

    t_total_sec = time.perf_counter() - t_start_total

    # Calculate real statistics
    avg_latency = float(np.mean(inference_times_ms))
    min_latency = float(np.min(inference_times_ms))
    max_latency = float(np.max(inference_times_ms))
    p95_latency = float(np.percentile(inference_times_ms, 95))
    throughput = round(num_iterations / t_total_sec, 2)

    print("\n" + "=" * 65)
    print(" BENCHMARK RESULTS (Actual Measured Performance)")
    print("=" * 65)
    print(f" Images Processed:       {num_iterations}")
    print(f" Total Processing Time:  {t_total_sec:.2f} seconds")
    print(f" Average Latency:        {avg_latency:.2f} ms")
    print(f" Minimum Latency:        {min_latency:.2f} ms")
    print(f" Maximum Latency:        {max_latency:.2f} ms")
    print(f" P95 Latency:            {p95_latency:.2f} ms")
    print(f" Approximate Throughput: {throughput} images/sec")
    print("=" * 65)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ConstructGuard CV Benchmark")
    parser.add_argument("--iterations", type=int, default=15, help="Number of benchmark iterations")
    parser.add_argument("--warmup", type=int, default=3, help="Number of warmup iterations")
    args = parser.parse_args()

    run_benchmark(num_iterations=args.iterations, warmup=args.warmup)
