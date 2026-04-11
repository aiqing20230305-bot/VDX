#!/bin/bash

# Script to batch-replace simple console.error patterns in API routes
# This handles the common pattern: console.error('[API Name]', error)

set -e

echo "🔧 Starting batch console.log replacement for API routes..."

# Find all API route files
API_ROUTES=$(find src/app/api -name "route.ts" -type f)

TOTAL_REPLACED=0

for file in $API_ROUTES; do
  # Check if file has console statements
  if grep -q "console\." "$file"; then
    echo "Processing: $file"

    # Check if logger is already imported
    if ! grep -q "import { logger } from '@/lib/utils/logger'" "$file"; then
      # Find the last import line
      LAST_IMPORT=$(grep -n "^import " "$file" | tail -1 | cut -d: -f1)

      if [ -n "$LAST_IMPORT" ]; then
        # Insert logger import after last import
        sed -i "" "${LAST_IMPORT}a\\
import { logger } from '@/lib/utils/logger'\\
\\
const log = logger.context('API')
" "$file"
        echo "  ✓ Added logger import"
      fi
    fi

    # Count console statements before
    BEFORE=$(grep -c "console\." "$file" || echo "0")

    # Replace common patterns
    # Pattern 1: console.error('[Name] Error:', error)
    sed -i "" -E "s/console\.error\('\[([^]]+)\] Error:', error\)/log.error('\1 request failed', error)/g" "$file"

    # Pattern 2: console.error('[Name]', err)
    sed -i "" -E "s/console\.error\('\[([^]]+)\]', (err|error)\)/log.error('\1 failed', \2)/g" "$file"

    # Count console statements after
    AFTER=$(grep -c "console\." "$file" || echo "0")

    REPLACED=$((BEFORE - AFTER))
    if [ $REPLACED -gt 0 ]; then
      echo "  ✓ Replaced $REPLACED console statements"
      TOTAL_REPLACED=$((TOTAL_REPLACED + REPLACED))
    fi
  fi
done

echo ""
echo "✨ Batch replacement complete!"
echo "📊 Total console statements replaced: $TOTAL_REPLACED"
echo ""
echo "⚠️  Note: This script only handles simple patterns."
echo "   Complex cases still need manual review."
