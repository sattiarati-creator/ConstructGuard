from pydantic_settings import BaseSettings
from pydantic import Field
import os
from pathlib import Path

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables and .env file.
    """
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Ultralytics YOLO Settings
    MODEL_NAME: str = Field(default="yolo11n.pt", description="YOLO model name or checkpoint path")
    CONFIDENCE_THRESHOLD: float = Field(default=0.40, ge=0.0, le=1.0, description="Detection confidence threshold")
    IMAGE_SIZE: int = Field(default=640, ge=32, description="Inference input resolution")

    # Upload validation limits
    MAX_IMAGE_SIZE_MB: float = Field(default=15.0, ge=0.1, description="Max uploaded image size in megabytes")

    # OpenCV Change Detection Parameters
    MIN_CONTOUR_AREA: float = Field(default=500.0, ge=0.0, description="Minimum contour area to filter noise")
    CHANGE_THRESHOLD: float = Field(default=25.0, ge=0.0, le=100.0, description="Baseline change alert threshold")
    LOW_CHANGE_THRESHOLD: float = Field(default=10.0, ge=0.0, le=100.0, description="Upper bound for LOW change level")
    MEDIUM_CHANGE_THRESHOLD: float = Field(default=25.0, ge=0.0, le=100.0, description="Upper bound for MEDIUM change level")
    HIGH_CHANGE_THRESHOLD: float = Field(default=50.0, ge=0.0, le=100.0, description="Upper bound for HIGH change level")

    class Config:
        env_file = [
            str(Path(__file__).resolve().parent.parent.parent / ".env"),
            str(Path(__file__).resolve().parent.parent.parent.parent / ".env"),
        ]
        extra = "ignore"

settings = Settings()
