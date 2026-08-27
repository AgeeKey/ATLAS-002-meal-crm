#!/usr/bin/env bash
export PATH="/home/iclou/.local/bin:$PATH"
cd /mnt/f/ATLAS/ATLAS-002-meal-crm

echo "=== 1. pre-commit run --all-files ===" > /tmp/checks_output.txt
uv run pre-commit run --all-files >> /tmp/checks_output.txt 2>&1
echo "pre-commit exit: $?" >> /tmp/checks_output.txt

echo "" >> /tmp/checks_output.txt
echo "=== 2. tsc --noEmit ===" >> /tmp/checks_output.txt
cd frontend
./node_modules/.bin/tsc -p tsconfig.build.json --noEmit >> /tmp/checks_output.txt 2>&1
echo "tsc exit: $?" >> /tmp/checks_output.txt

echo "" >> /tmp/checks_output.txt
echo "=== 3. npm run build ===" >> /tmp/checks_output.txt
./node_modules/.bin/vite build >> /tmp/checks_output.txt 2>&1
echo "build exit: $?" >> /tmp/checks_output.txt

echo "" >> /tmp/checks_output.txt
echo "=== 4. playwright test ===" >> /tmp/checks_output.txt
cd /mnt/f/ATLAS/ATLAS-002-meal-crm/frontend
./node_modules/.bin/playwright test >> /tmp/checks_output.txt 2>&1
echo "playwright exit: $?" >> /tmp/checks_output.txt
