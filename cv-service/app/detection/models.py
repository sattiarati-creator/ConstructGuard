from pydantic import BaseModel, Field
from typing import List

class BoundingBox(BaseModel):
    x: float = Field(..., description="Top-left X coordinate in pixels")
    y: float = Field(..., description="Top-left Y coordinate in pixels")
    width: float = Field(..., description="Bounding box width in pixels")
    height: float = Field(..., description="Bounding box height in pixels")

class Detection(BaseModel):
    class_name: str = Field(..., alias="class", description="Identified object class name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bounding_box: BoundingBox

    class Config:
        populate_by_name = True

class DetectionResponse(BaseModel):
    success: bool = True
    detections: List[Detection] = Field(default_factory=list)
    inference_time_ms: float = Field(..., description="Model inference duration in milliseconds")
    image_width: int
    image_height: int
