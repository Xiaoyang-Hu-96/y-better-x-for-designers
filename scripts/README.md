# Scripts

## csv-to-json

Converts Google Sheets CSV export → `public/data/data.json` (loaded by the app at `/data/data.json`).

**Expected CSV columns:** `category`, `name`, `url`, `note`, `tier`, `handle`, `bio`

**Category IDs:** `x-bloggers`, `design-inspiration`, `ui-components`, `framer-resources`, `portfolio-inspiration`, `portfolio-platforms`

### Usage

```bash
# From file
node scripts/csv-to-json.js path/to/export.csv

# From stdin
cat export.csv | node scripts/csv-to-json.js

# Or use npm script
npm run csv-to-json < export.csv
```

**Note:** The script overwrites `public/data/data.json`. Back up first if needed.

### Sample

See `scripts/sample.csv` for the expected format.
