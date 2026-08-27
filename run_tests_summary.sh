#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm/backend
FASTAPI_ENV=development uv run coverage run -m pytest tests/ 2>&1 | grep -E "(passed|failed|error)" | tail -3
echo "---"
uv run coverage report 2>&1 | tail -20
