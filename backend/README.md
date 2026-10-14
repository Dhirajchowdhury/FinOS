# Backend Overview

This folder contains the FastAPI server implementation.

- **app/** – Python package with all source code.
  - `api/` – route definitions.
  - `core/` – settings, logger, utilities.
  - `db/` – database connection and migrations.
  - `models/` – ORM / Pydantic models.
  - `schemas/` – request/response schemas.
  - `services/` – business‑logic layer.
  - `main.py` – FastAPI entry point.
- **tests/** – unit and integration tests for the backend.
- **data/** – persistent files such as `finos.db`.
- **logs/** – runtime logs (`dev.log`).
- **.env.example**, **requirements.txt** – environment and dependencies.

The build configuration (Dockerfile, docker‑compose.yml) still points to this folder, so no build changes are required.
