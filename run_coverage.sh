#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm/backend
FASTAPI_ENV=development uv run coverage run -m pytest tests/
uv run coverage report
