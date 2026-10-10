from pydantic import BaseModel, Field
from typing import List

class ChangedRegion(BaseModel):
    x: int = Field(..., description="Top-left X coordinate of bounding box")
    y: int = Field(..., description="Top-left Y coordinate of bounding box")
    width: int = Field(..., description="Width of changed region in pixels")
    height: int = Field(..., description="Height of changed region in pixels")
    area: float = Field(..., description="Contour pixel area")

class ChangeDetectionResponse(BaseModel):
    success: bool = True
    change_percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage of altered pixels across image")
    change_level: str = Field(..., description="Change severity: LOW, MEDIUM, HIGH, or CRITICAL")
    changed_regions: List[ChangedRegion] = Field(default_factory=list, description="Bounding boxes of significant changes")
    processing_time_ms: float = Field(..., description="Differential pipeline latency in milliseconds")
