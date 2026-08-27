#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm/backend
FASTAPI_ENV=development uv run pytest tests/api/routes/test_meal_crm.py::test_get_freeze_days_skips_invalid_range tests/api/routes/test_meal_crm.py::test_sync_completes_paused_package_when_fully_consumed tests/api/routes/test_meal_crm.py::test_sync_keeps_paused_package_with_remaining_days -v --tb=long 2>&1 | tail -80
