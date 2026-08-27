#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm/backend

echo "=== BRANCH ==="
git branch --show-current 2>/dev/null || echo "unknown"

echo ""
echo "=== mypy ==="
uv run mypy app 2>&1
mypy_result=$?
echo "mypy exit: $mypy_result"

echo ""
echo "=== ty ==="
uv run ty check app 2>&1
ty_result=$?
echo "ty exit: $ty_result"

echo ""
echo "=== tests + coverage ==="
FASTAPI_ENV=development uv run coverage run -m pytest tests/ 2>&1 | grep -E "(passed|failed|error)" | tail -3
uv run coverage report 2>&1 | tail -5
