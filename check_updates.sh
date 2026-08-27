#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm

echo "=== git log -3 --oneline ==="
git log -3 --oneline

echo ""
echo "=== git branch --show-current ==="
git branch --show-current

echo ""
echo "=== grep: sa_type=DateTime(timezone=True) ==="
git grep -n "sa_type=DateTime(timezone=True)" || echo "(ничего не найдено)"

echo ""
echo "=== grep: sa_column=Column(DateTime(timezone=True)) ==="
git grep -n "sa_column=Column(DateTime(timezone=True))" || echo "(ничего не найдено)"
