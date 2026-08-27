#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm

echo "=== pre-commit run --all-files ==="
uv run pre-commit run --all-files 2>&1
echo "pre-commit exit: $?"
