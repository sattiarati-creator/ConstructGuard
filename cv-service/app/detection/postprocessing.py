from typing import List, Tuple
from .models import Detection

# Pretrained COCO classes and domain-specific construction classes
CONSTRUCTION_RELEVANT_CLASSES = {
    # Direct COCO 80 categories
    "person": "Worker / Personnel on site",
    "truck": "Hauling / Construction vehicle",
    "car": "Vehicular presence",
    "bus": "Transport vehicle",
    # Extended / Fine-tuned categories
    "excavator": "Heavy excavation equipment",
    "crane": "High-altitude lifting machinery",
    "bulldozer": "Earthmoving equipment",
    "concrete_mixer": "Concrete transport equipment",
}

def filter_detections_by_confidence(
    detections: List[Detection],
    threshold: float,
) -> List[Detection]:
    """Filters candidate detections to only those meeting the threshold."""
    return [d for d in detections if d.confidence >= threshold]

def categorize_construction_objects(
    detections: List[Detection],
) -> Tuple[List[Detection], List[str]]:
    """
    Identifies construction-relevant objects from detections and generates
    human-readable evidence indicators.
    
    Note on Pretrained Weights:
    Standard COCO dataset models directly recognize 'person', 'truck', and 'car'.
    Specialized machinery ('excavator', 'crane') are flagged when a custom-trained
    checkpoint is loaded into MODEL_NAME.
    """
    matched: List[Detection] = []
    indicators: List[str] = []

    for d in detections:
        c_lower = d.class_name.lower()
        if c_lower in CONSTRUCTION_RELEVANT_CLASSES:
            matched.append(d)
            desc = CONSTRUCTION_RELEVANT_CLASSES[c_lower]
            indicators.append(f"{desc}: '{d.class_name}' (conf: {d.confidence:.2f})")

    return matched, indicators
