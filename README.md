# Meal CRM MVP

[![Test Docker Compose](../../actions/workflows/test-docker-compose.yml/badge.svg)](../../actions/workflows/test-docker-compose.yml)
[![Test Backend](../../actions/workflows/test-backend.yml/badge.svg)](../../actions/workflows/test-backend.yml)

Meal CRM for managing clients, meal packages, deliveries, freezes, extensions, payments, and manager notes.

## Stack

- FastAPI + SQLModel
- PostgreSQL + Alembic
- React frontend (existing app structure preserved)
- Docker Compose for local development

## Run locally

1. Start services:

```bash
docker compose up -d
```

2. Apply migrations:

```bash
docker compose exec backend bash scripts/prestart.sh
```

3. Open API docs:

- `http://localhost:8000/docs`

## Backend tests

From `backend/`:

```bash
uv run pytest
```

## API overview (MVP)

- Clients: `POST /api/v1/clients`, `GET /api/v1/clients`, `GET /api/v1/clients/{id}`, `PATCH /api/v1/clients/{id}`
- Packages: `POST /api/v1/packages`, `GET /api/v1/packages`, `GET /api/v1/packages/{id}`, `PATCH /api/v1/packages/{id}`
- Payments: `POST /api/v1/payments`, `GET /api/v1/packages/{id}/payments`
- Additional package events:
  - `POST /api/v1/packages/{id}/deliveries`
  - `POST /api/v1/packages/{id}/freezes`
  - `POST /api/v1/packages/{id}/extensions`
- Notes: `POST /api/v1/clients/{id}/notes`

Package detail includes computed metrics: deliveries count (by `sent_date`), freeze days, extension days, days used, days remaining, paid amount, and debt.
