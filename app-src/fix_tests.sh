#!/bin/bash

# This script fixes all setting row tests by wrapping components in table structure

FILES="tests/unit/components/settings/rows/DarkModeRow.test.js
tests/unit/components/settings/rows/DefaultLayoutRow.test.js
tests/unit/components/settings/rows/LocaleRow.test.js
tests/unit/components/settings/rows/ShowNamesButtonsRow.test.js
tests/unit/components/settings/rows/ShowNavLabelsRow.test.js
tests/unit/components/settings/rows/TimeZoneRow.test.js
tests/unit/components/settings/rows/CenteredLayoutRow.test.js"

for file in $FILES; do
  echo "Fixing $file..."
  
  # Replace render(<Component />) with render(<table><tbody><Component /></tbody></table>)
  sed -i 's/render(<\([A-Za-z]*Row\) \/>)/render(\n        <table>\n          <tbody>\n            <\1 \/>\n          <\/tbody>\n        <\/table>\n      )/g' "$file"
  
  # Replace render(<Component props={...} />) with render(<table><tbody><Component props={...} /></tbody></table>)
  sed -i 's/render(<\([A-Za-z]*Row\) \(.*\)\/>)/render(\n        <table>\n          <tbody>\n            <\1 \2\/>\n          <\/tbody>\n        <\/table>\n      )/g' "$file"
  
  echo "Fixed $file"
done

echo "All setting row tests have been fixed!"
