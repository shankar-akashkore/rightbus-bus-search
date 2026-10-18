# Convenience commands. Run `make help` to list them.
VENV := backend/.venv
BIN := $(CURDIR)/$(VENV)/bin

.PHONY: help install dev mock-gds backend frontend test test-backend test-frontend lint

help: ## List available commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-14s %s\n", $$1, $$2}'

install: ## Create the Python venv and install backend + frontend dependencies
	python3 -m venv $(VENV)
	$(BIN)/pip install -r backend/requirements-dev.txt
	cd frontend && npm install

dev: ## Run mock GDS (:8001), backend (:8000) and frontend (:5173) together
	$(MAKE) -j3 mock-gds backend frontend

mock-gds: ## Run only the mock GDS API on :8001
	cd backend && $(BIN)/uvicorn mock_gds.main:app --port 8001 --reload --reload-dir mock_gds

backend: ## Run only the RightBus backend on :8000
	cd backend && $(BIN)/uvicorn app.main:app --port 8000 --reload --reload-dir app

frontend: ## Run only the React dev server on :5173
	cd frontend && npm run dev

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests (pytest)
	cd backend && $(BIN)/pytest

test-frontend: ## Run frontend tests (Vitest)
	cd frontend && npm test

lint: ## Lint backend (ruff) and frontend (oxlint)
	cd backend && $(BIN)/ruff check . && $(BIN)/ruff format --check .
	cd frontend && npm run lint
