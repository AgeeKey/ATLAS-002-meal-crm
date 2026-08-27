#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm

echo "=== remote commits not in local ==="
git log --oneline copilot/atlas-002-finish-mvp..origin/copilot/atlas-002-finish-mvp 2>/dev/null || echo "cannot compare"

echo ""
echo "=== local commits not in remote ==="
git log --oneline origin/copilot/atlas-002-finish-mvp..copilot/atlas-002-finish-mvp 2>/dev/null || echo "cannot compare"

echo ""
echo "=== fetch again and check ==="
git fetch origin copilot/atlas-002-finish-mvp
git log --oneline -5 origin/copilot/atlas-002-finish-mvp
