#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm/backend
FASTAPI_ENV=development uv run pytest tests/ -v --tb=short 2>&1 | grep -E "(FAILED|PASSED|ERROR|test_)" | grep -v PASSED | head -30
echo "---"
FASTAPI_ENV=development uv run pytest tests/ -v --tb=line 2>&1 | grep -E "FAILED" | head -10
