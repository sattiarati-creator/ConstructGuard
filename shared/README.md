# Shared Module

This directory contains cross-cutting domain specifications, data transfer objects (DTOs), and protocol schemas shared conceptually across the ConstructGuard ecosystem:

- `types/events.ts`: Core data structures for computer vision detections, sensor readings, risk scores, and alert statuses.
- Can be imported by the Node.js backend and React frontend, or used as the schema specification for Python Pydantic models.
