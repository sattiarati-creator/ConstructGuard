from .routes_detection import router as detection_router
from .routes_change import router as change_router
from .routes_analysis import router as analysis_router

__all__ = ["detection_router", "change_router", "analysis_router"]
