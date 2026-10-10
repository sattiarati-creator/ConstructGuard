.PHONY: help dev build test test-backend test-frontend test-cv test-iot seed docker-up docker-down clean

help:
	@echo "ConstructGuard - Smart Unauthorized Construction Monitoring & Risk Intelligence"
	@echo "=================================================================================="
	@echo "Available targets:"
	@echo "  make dev            - Start all services locally for development"
	@echo "  make build          - Build frontend, backend, and container images"
	@echo "  make test           - Run full test suite across all 4 services (Node, Pytest, React)"
	@echo "  make test-backend   - Run Jest tests in backend service (12 test suites, 100 tests)"
	@echo "  make test-frontend  - Run Vitest tests in frontend service"
	@echo "  make test-cv        - Run Pytest tests in Computer Vision service"
	@echo "  make test-iot       - Run Pytest tests in IoT Simulator service"
	@echo "  make seed           - Seed PostgreSQL with Bangalore sites, cameras, and test users"
	@echo "  make docker-up      - Launch full multi-container stack via Docker Compose"
	@echo "  make docker-down    - Tear down Docker Compose containers and networks"
	@echo "  make clean          - Clean node_modules, cache dirs, and temp artifacts"

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

seed:
	cd backend && npm run seed

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

test-cv:
	cd cv-service && pytest

test-iot:
	cd iot-simulator && pytest

test: test-backend test-frontend test-cv test-iot

build:
	cd backend && npm run build
	cd frontend && npm run build

clean:
	rm -rf backend/dist frontend/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
