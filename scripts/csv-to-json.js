#!/usr/bin/env node
/**
 * csv-to-json.js
 * Converts Google Sheets CSV export → data.json
 *
 * Expected CSV columns: category, name, url, note, tier, handle, bio
 *
 * Usage:
 *   node scripts/csv-to-json.js < input.csv
 *   node scripts/csv-to-json.js path/to/export.csv
 */

const fs = require("fs");
const path = require("path");

const CATEGORY_META = {
  "x-bloggers": {
    label: "X Accounts to Follow",
    description:
      "The foundation of your daily aesthetic intake. These designers work at places like Vercel, Figma, Linear, and OpenAI — following them consistently will quietly sharpen your eye over time.",
  },
  "design-inspiration": {
    label: "Design Inspiration",
    description:
      "Visual reference, interaction inspiration, and aesthetic training. Covers motion galleries, landing page inspiration, experimental design, tools, and personal websites.",
  },
  "ui-components": {
    label: "UI Component Libraries",
    description:
      "Front-end UI components and code resources. Most designers have not heard of these — but they are essential if you are doing web coding. Mostly React ecosystem, covering motion components, creative interactions, and style-themed libraries.",
  },
  "framer-resources": {
    label: "Framer Resources",
    description:
      "Resources within the Framer ecosystem — components, templates, interaction code, and UI kits. For designers building portfolios or landing pages in Framer.",
  },
  "portfolio-inspiration": {
    label: "Portfolio Inspiration",
    description:
      "A curated selection of designer portfolio sites, mostly entry-level and mid-level. Covers Framer, Webflow, and custom-built. Focus on visual style, information structure, and interaction details.",
  },
  "portfolio-platforms": {
    label: "Portfolio Platforms",
    description:
      "Third-party platforms for discovering and researching great portfolios — good for systematic browsing and filtering.",
  },
};

const CATEGORY_ORDER = [
  "x-bloggers",
  "design-inspiration",
  "ui-components",
  "framer-resources",
  "portfolio-inspiration",
  "portfolio-platforms",
];

function parseCSV(text) {
  const rows = [];
  let cur = "";
  let inQuotes = false;
  const flush = () => {
    if (cur.trim()) rows.push(cur.trim());
    cur = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if ((ch === "," || ch === "\n") && !inQuotes) {
      if (ch === "\n") {
        flush();
      } else {
        rows.push(cur.trim());
        cur = "";
      }
    } else {
      cur += ch;
    }
  }
  flush();
  return rows;
}

function parseCSVRows(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const parseLine = (line) => {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];
      if (ch === '"') {
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((ch === "," || ch === "\n") && !inQuotes) {
        result.push(cur.replace(/^"|"$/g, "").trim());
        cur = "";
        if (ch === "\n") break;
      } else {
        cur += ch;
      }
    }
    result.push(cur.replace(/^"|"$/g, "").trim());
    return result;
  };
  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = vals[j] !== undefined ? vals[j] : "";
    });
    rows.push(row);
  }
  return rows;
}

function toItem(row) {
  const tier = parseInt(row.tier, 10);
  return {
    name: row.name || "",
    url: row.url || "",
    note: row.note && row.note.trim() ? row.note.trim() : null,
    tier: tier === 1 || tier === 2 ? tier : 2,
    handle: row.handle && row.handle.trim() ? row.handle.trim() : null,
    bio: row.bio && row.bio.trim() ? row.bio.trim() : null,
  };
}

function main() {
  let input;
  const arg = process.argv[2];
  if (arg) {
    input = fs.readFileSync(path.resolve(process.cwd(), arg), "utf-8");
  } else {
    input = fs.readFileSync(process.stdin.fd, "utf-8");
  }

  const rows = parseCSVRows(input);
  const byCategory = {};

  for (const row of rows) {
    const cat = (row.category || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!cat) continue;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(toItem(row));
  }

  const categories = [];
  for (const id of CATEGORY_ORDER) {
    if (!byCategory[id]) continue;
    const meta = CATEGORY_META[id] || {
      label: id,
      description: "",
    };
    categories.push({
      id,
      label: meta.label,
      description: meta.description,
      items: byCategory[id],
    });
  }

  // Include any categories not in CATEGORY_ORDER
  for (const id of Object.keys(byCategory)) {
    if (CATEGORY_ORDER.includes(id)) continue;
    categories.push({
      id,
      label: id,
      description: "",
      items: byCategory[id],
    });
  }

  const output = {
    meta: {
      title: "Design Resource Library",
      author: "Xiaoyang Hu",
      site: "xiaoyanghu.com",
      description:
        "A curated collection of design resources for designers and web coders, organized by category.",
    },
    categories,
  };

  const outPath = path.join(process.cwd(), "public", "data", "data.json");
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${outPath} (${categories.length} categories, ${rows.length} items)`);
}

main();
