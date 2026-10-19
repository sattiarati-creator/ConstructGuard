import time
import logging
import numpy as np
from typing import List, Optional, Tuple
from .models import Detection, BoundingBox
from .postprocessing import filter_detections_by_confidence
from app.config.settings import settings

logger = logging.getLogger("constructguard.detection")

class Detector:
    """
    Ultralytics YOLO Object Detector wrapper.
    Ensures the deep learning model is loaded exactly once into memory at startup.
    """
    def __init__(
        self,
        model_name: Optional[str] = None,
        confidence_threshold: Optional[float] = None,
        image_size: Optional[int] = None,
    ):
        self.model_name = model_name or settings.MODEL_NAME
        self.confidence_threshold = confidence_threshold or settings.CONFIDENCE_THRESHOLD
        self.image_size = image_size or settings.IMAGE_SIZE
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        """Loads model weights once into memory."""
        logger.info(f"Loading YOLO model checkpoint: '{self.model_name}'...")
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_name)
            logger.info(f"YOLO model '{self.model_name}' loaded successfully.")
        except Exception as e:
            logger.warning(
                f"Could not load '{self.model_name}' directly ({e}). "
                "Detector will operate in fallback mode until valid weights are provided."
            )
            self.model = None

    def detect(self, image: np.ndarray) -> Tuple[List[Detection], float]:
        """
        Runs object detection on the input OpenCV BGR image.
        
        Args:
            image: NumPy ndarray with shape (H, W, 3).
            
        Returns:
            Tuple of (list of Detection objects, inference_time_ms).
        """
        if image is None or image.size == 0:
            return [], 0.0

        start_time = time.perf_counter()
        detections: List[Detection] = []

        if self.model is not None:
            # Run inference with configurable resolution and threshold
            results = self.model(
                image,
                conf=self.confidence_threshold,
                imgsz=self.image_size,
                verbose=False,
            )

            for r in results:
                boxes = r.boxes
                if boxes is None:
                    continue

                for box in boxes:
                    coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    conf = float(box.conf[0])
                    cls_idx = int(box.cls[0])
                    class_name = r.names[cls_idx] if hasattr(r, "names") else str(cls_idx)

                    x1, y1, x2, y2 = coords
                    width = max(0.0, x2 - x1)
                    height = max(0.0, y2 - y1)

                    detections.append(
                        Detection(
                            **{
                                "class": class_name,
                                "confidence": round(conf, 3),
                                "bounding_box": BoundingBox(
                                    x=round(x1, 1),
                                    y=round(y1, 1),
                                    width=round(width, 1),
                                    height=round(height, 1),
                                ),
                            }
                        )
                    )

        # Apply confidence filtering pass
        filtered_detections = filter_detections_by_confidence(
            detections, self.confidence_threshold
        )
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        
        return filtered_detections, duration_ms
