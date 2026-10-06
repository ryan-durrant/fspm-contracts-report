# FSPM Contracts Report

Weekly First Serve Property Management contracts report. The site follows the seven-page manager PDF: cover, contracts, last year’s comparison, week’s highlights, goals, the next semester, and community housing.

`/` and `/latest` both show the current week. Dated snapshots live at `/archive/YYYY-MM-DD`. The committed report is the Fall 2026 report that ran on 08/24/2026, with the same structure and figures as that PDF.

There is no custom domain. GitHub Pages publishes the free `*.github.io` URL. The Monday email should link to `/` or `/latest`.

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:4317

```bash
npm test
npm run build   # static export in out/
```

## Change the tip, the quote, or who manages which houses

Edit `config/teams.json`. No component changes.

- `quote` — cover sidebar
- `tip` — Tip of the Week (intro, link, closing)
- `teams` — manager group name, header color, and property order
- `properties` — display name, bed capacity, apt vs house, and sheet-name aliases
- `offices` — community housing groups and bed counts
- `goalsCopy` and `communityNote` — the goals essay, the $200 bonus, and the Friday reminder

Capacities used for Winter 2027 (and this Fall report) are on each property: Carriage 234, Townhouse 8, Avonlea House 14, Avonlea Women 66, Haven Blue 140, Haven 179 / 175 / 163 = 7, Haven 149 = 12, Haven White 24, Avonlea Men 79, Haven 129 = 6, Haven Green and Haven Red 48.

After editing, rebuild and redeploy (`npm run build`, or push to `main` and let Pages build).

## Monday rebuild

The numbers come from the Google Sheet **Rexburg Real Estate Database**.

- Spreadsheet id: `1gLi53sg64WOoLf0LsCB1wTmsfQGZoeS4QTE3pjqy98c`
- Tabs: `contract_tracker - W27` and `contract_tracker - S27` (Fall is `contract_tracker - F26`)

The script reads a local export. It does not call the Sheets API, and it does not write to the sheet.

### What each column means

| Column | Header | Becomes |
| --- | --- | --- |
| A | Property | Matched to `config/teams.json` aliases (`The Carriage House` → Carriage House, `Avonlea (W)` → Avonlea Women, `Haven House 179` → Haven 179, …) |
| B | Semester name (`Winter 2027`, …) | Bed capacity |
| C onward | A Monday date (`10/5/26`) | Contracts signed that week |
| A repeated date | Second `10/5/26` column | Unapproved count (green: in a bed, contract not signed) |
| Total | | Checksum. The script warns if property rows do not add up. |
| Market Beds Sold | `16244` in column B, then weekly counts | Market bed capacity, and the highlights chart |

Inactive leads (the blue number) are not on `contract_tracker`. Pass them with `--inactive`. Community housing is typed in by managers; keep it in `--editorial` or let `--previous` carry last week forward.

Export path: open the tab, **File → Download → Comma-separated values (.csv)**. One CSV per tab.

### Command

```bash
node scripts/build-from-sheet.mjs \
  --tracker ~/Downloads/contract_tracker-W27.csv \
  --as-of 2026-10-05 \
  --next ~/Downloads/contract_tracker-S27.csv \
  --inactive data/inbox/inactive.json \
  --unapproved data/inbox/unapproved.json \
  --editorial data/editorial/f26-2026-08-24.json \
  --previous data/report.json \
  --write
```

`--write` updates `data/report.json` and `data/archive/<date>.json`. `/` and `/latest` read `data/report.json`. Drop `--as-of` to use the latest date column.

`--unapproved` is optional when the tracker already has a duplicate date column (Winter 2027 does). `--previous` keeps community counts, last-year comparison, and women’s/men’s callouts when this week’s files do not include them.

Aggregated JSON also works if you already rolled the tab up:

```bash
node scripts/build-from-sheet.mjs \
  --counts data/samples/counts-w27.json \
  --unapproved data/samples/unapproved-w27.json \
  --inactive data/samples/inactive-w27.json \
  --market data/samples/market-2026-10-05.json \
  --as-of 2026-10-05
```

`npm run report:build` regenerates the checked-in Fall 2026 sample from `data/samples/` and `data/editorial/f26-2026-08-24.json`.

A few chart labels on that published PDF were rounded off the sheet’s month-end totals (February is 283 on the tab and 282 on the PDF). The editorial file pins the printed labels. Later Mondays can omit `monthlyContracts` in the editorial file and the script will plot the last snapshot in each month.

Haven 179 on the Winter 2027 page of the 08/24 PDF is printed as 5/7. The `contract_tracker - W27` cell for 8/24/2026 is 3, which is what makes the chart total 361 and BNH occupancy 51.6%. The editorial file keeps the printed card.

### Live API

`fetchTrackerFromSheets()` throws. Leave it that way unless you add a **read-only** fetch. Do not give the script a scope that can edit the spreadsheet.

## Deploy

### GitHub Pages (preferred)

Public preview: https://ryan-durrant.github.io/fspm-contracts-report/

Origin stays the source of truth. `main` is also pushed to the public GitHub repo `ryan-durrant/fspm-contracts-report`, which is only the Pages host.

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Push to `main`. `.github/workflows/pages.yml` runs tests, builds the static export with `BASE_PATH=/fspm-contracts-report`, and deploys it.

Send the Monday email to `/` or `/latest` on that host (`/latest/` and `/archive/2026-08-24/` include the project prefix).

### Vercel

Import the repo. Framework preset Next.js. `output: "export"` in `next.config.ts` publishes the static `out/` build. Leave `BASE_PATH` empty on Vercel.

## Routes

| Path | Report |
| --- | --- |
| `/` | Current week (`data/report.json`) |
| `/latest` | Same report, stable email target |
| `/archive` | List of snapshots |
| `/archive/2026-08-24` | That Monday |

## Data map

```
config/teams.json          groups, colors, tip, quote, capacities
data/report.json           current week, read by / and /latest
data/archive/<date>.json   snapshot written by --write
data/editorial/            numbers the sheet does not store (YoY, goals, community, pinned chart labels)
data/samples/              F26 / W27 / S27 tracker exports and the 10/05 count files (counts only; no resident names)
scripts/build-from-sheet.mjs
```
