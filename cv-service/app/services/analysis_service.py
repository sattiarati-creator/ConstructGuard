import time
import logging
from typing import List, Optional, Tuple, Dict, Any
import numpy as np
from pydantic import BaseModel, Field

from app.detection.detector import Detector
from app.detection.models import Detection
from app.detection.postprocessing import categorize_construction_objects
from app.change_detection.differ import ChangeDiffer

logger = logging.getLogger("constructguard.analysis")

class ConstructionObjectItem(BaseModel):
    class_name: str = Field(..., alias="class", description="Identified construction object class")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence rating")

    class Config:
        populate_by_name = True

class AnalysisResponse(BaseModel):
    success: bool = True
    construction_activity_score: float = Field(..., ge=0.0, le=100.0, description="Normalized score 0-100 indicating detected construction signals")
    change_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Normalized percentage visual change from prior baseline")
    construction_objects: List[ConstructionObjectItem] = Field(default_factory=list, description="List of recognized construction machines or personnel")
    risk_indicators: List[str] = Field(default_factory=list, description="Human-readable evidence findings")
    inference_time_ms: float = Field(..., description="Cumulative execution time in milliseconds")

class AnalysisService:
    """
    Orchestrates multi-modal visual analysis:
    Combines YOLO object detection with OpenCV temporal change analysis.
    
    IMPORTANT:
    This service is an objective 'Construction Activity & Visual Indicator' evaluator.
    It does NOT make legal determinations of illegality; rather, it quantifies
    visual physical signals for operator risk assessment.
    """
    def __init__(self, detector: Detector, change_differ: ChangeDiffer):
        self.detector = detector
        self.change_differ = change_differ

    def analyze(
        self,
        curr_img: np.ndarray,
        prev_img: Optional[np.ndarray] = None,
    ) -> AnalysisResponse:
        total_start = time.perf_counter()

        # 1. Object Detection on Current Image
        detections, det_time_ms = self.detector.detect(curr_img)
        construction_objs, indicators = categorize_construction_objects(detections)

        # 2. Change Detection (if previous frame supplied)
        change_percentage = 0.0
        change_time_ms = 0.0

        if prev_img is not None:
            pct, level, regions, c_time = self.change_differ.compare(prev_img, curr_img)
            change_percentage = pct
            change_time_ms = c_time

            if pct > 0:
                indicators.append(
                    f"Visual change detected: {pct:.1f}% alteration ({level} intensity with {len(regions)} regions)"
                )
        else:
            indicators.append("Single image analysis: no prior observation provided for delta comparison")

        # 3. Calculate Construction Activity Score (0 - 100)
        # Weights:
        # - Heavy equipment (excavator, crane, bulldozer): +40 per item (max 60)
        # - Vehicles (truck): +25 per item (max 40)
        # - Workers (person): +15 per item (max 30)
        # - Visual change > 25%: +30
        visual_activity = 0.0
        for obj in construction_objs:
            name = obj.class_name.lower()
            if name in ["excavator", "crane", "bulldozer", "concrete_mixer"]:
                visual_activity = min(60.0, visual_activity + (obj.confidence * 40.0))
            elif name in ["truck", "bus"]:
                visual_activity = min(50.0, visual_activity + (obj.confidence * 25.0))
            elif name in ["person"]:
                visual_activity = min(30.0, visual_activity + (obj.confidence * 15.0))
            else:
                visual_activity = min(30.0, visual_activity + (obj.confidence * 10.0))

        # Blend visual detection activity with physical delta score
        # Activity score = 60% detection weight + 40% change weight (or 100% detection if no prev img)
        if prev_img is not None:
            raw_score = (visual_activity * 0.6) + (min(100.0, change_percentage * 1.5) * 0.4)
        else:
            raw_score = visual_activity

        activity_score = round(min(100.0, max(0.0, raw_score)), 1)
        total_duration_ms = round((time.perf_counter() - total_start) * 1000.0, 2)

        # Format construction object items
        formatted_objects = [
            ConstructionObjectItem(
                **{"class": d.class_name, "confidence": round(d.confidence, 3)}
            )
            for d in construction_objs
        ]

        return AnalysisResponse(
            success=True,
            construction_activity_score=activity_score,
            change_score=round(change_percentage, 1),
            construction_objects=formatted_objects,
            risk_indicators=indicators,
            inference_time_ms=total_duration_ms,
        )
