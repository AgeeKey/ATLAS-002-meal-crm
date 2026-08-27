#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm

echo "=== 1. pre-commit run --all-files ==="
pre-commit run --all-files 2>&1
echo "pre-commit exit: $?"

echo ""
echo "=== 2. tsc --noEmit ==="
cd frontend
npx tsc -p tsconfig.build.json --noEmit 2>&1
echo "tsc exit: $?"

echo ""
echo "=== 3. npm run build ==="
npm run build 2>&1
echo "build exit: $?"

echo ""
echo "=== 4. playwright test ==="
npx playwright test 2>&1
echo "playwright exit: $?"
