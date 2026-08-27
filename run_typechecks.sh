#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm/backend
echo "=== mypy ==="
uv run mypy app 2>&1
echo "mypy exit: $?"
echo "=== ty ==="
uv run ty check app 2>&1
echo "ty exit: $?"
