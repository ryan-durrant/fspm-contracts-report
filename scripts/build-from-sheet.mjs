#!/usr/bin/env node
/**
 * Build data/report.json from a Monday export of the Rexburg Real Estate Database.
 *
 * Sheet: "Rexburg Real Estate Database"
 * ID:    1gLi53sg64WOoLf0LsCB1wTmsfQGZoeS4QTE3pjqy98c
 * Tabs:  contract_tracker - W27, contract_tracker - S27 (and F26, …)
 *
 * This script only reads local CSV / JSON. It does not call the Sheets API and
 * it never writes to the spreadsheet.
 *
 * Tracker tab shape (row 1 is the header):
 *   A  Property                          sheet name, mapped via config/teams.json aliases
 *   B  {Semester}                        capacity for that semester (header is "Fall 2026", …)
 *   C+ one column per Monday snapshot    header is M/D/YY, cell is contracts signed
 *   A repeated date column               the SECOND column for the same date is unapproved
 *                                        (people in a bed who have not signed — the green number)
 *   Total                                checksum row
 *   Percentage of Total                  ignored
 *   Notes on the week:                   ignored
 *   Market Beds Sold                     col B is BYU-I market bed capacity (16,244);
 *                                        later columns are market beds sold that week
 *
 * Other local inputs:
 *   --unapproved   green numbers, if the tracker has no duplicate date column
 *   --inactive     blue numbers (inactive leads). Not a column on contract_tracker.
 *   --counts       already-aggregated JSON (property -> filled) when you do not have the CSV
 *   --market       market bed JSON ({ winter_2027: { market, women, men } } or { sold })
 *   --editorial    quote-adjacent numbers the sheet does not know (YoY, goals, community, chart pins)
 *   --previous     last week's report.json; community / last year / gender callouts carry forward
 *   --last-year    prior semester tracker CSV, read near the same calendar day last year
 *
 * Live API: fetchTrackerFromSheets() throws on purpose. See README for the export steps.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") {
      cell += c;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function parseUsDate(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return null;
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  const month = String(Number(match[1])).padStart(2, "0");
  const day = String(Number(match[2])).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function monthLabel(iso) {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]}-${year.slice(2)}`;
}

function toNumber(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[%,$\s,]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadTeams(file = path.join(ROOT, "config/teams.json")) {
  return readJson(file);
}

export function buildAliasIndex(teams) {
  const index = new Map();
  for (const property of teams.properties) {
    const labels = [property.id, property.name, ...(property.aliases ?? [])];
    for (const label of labels) {
      index.set(normalizeName(label), property);
    }
  }
  return index;
}

export function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function lookupProperty(index, name) {
  return index.get(normalizeName(name)) ?? null;
}

/**
 * Parse a contract_tracker CSV into capacities, weekly counts, unapproved
 * (duplicate date column), and the market-beds row.
 */
export function parseTracker(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => String(cell).trim() !== ""));
  if (!rows.length) throw new Error("Tracker CSV is empty.");
  const header = rows[0].map((cell) => String(cell).trim());
  const semester = header[1] || "Semester";
  const columns = [];
  const dateSeen = new Map();
  for (let i = 2; i < header.length; i++) {
    const iso = parseUsDate(header[i]);
    if (!iso) continue;
    const role = dateSeen.has(iso) ? "unapproved" : "count";
    dateSeen.set(iso, true);
    columns.push({ index: i, iso, role });
  }
  const countColumns = columns.filter((column) => column.role === "count");
  const unapprovedByDate = new Map();
  for (const column of columns) {
    if (column.role === "unapproved") unapprovedByDate.set(column.iso, column);
  }

  const properties = [];
  let totalRow = null;
  let marketRow = null;
  const skipped = [];

  for (const row of rows.slice(1)) {
    const name = String(row[0] ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (key === "total") {
      totalRow = row;
      continue;
    }
    if (key.startsWith("percentage")) continue;
    if (key.startsWith("notes")) continue;
    if (key.startsWith("market beds")) {
      marketRow = row;
      continue;
    }
    const capacity = toNumber(row[1]);
    properties.push({
      sourceName: name,
      capacity,
      counts: countColumns.map((column) => toNumber(row[column.index]) ?? 0),
      unapproved: Object.fromEntries(
        [...unapprovedByDate.entries()].map(([iso, column]) => [iso, toNumber(row[column.index]) ?? 0]),
      ),
    });
  }

  const marketCapacity = marketRow ? toNumber(marketRow[1]) : null;
  const marketSold = marketRow ? countColumns.map((column) => toNumber(marketRow[column.index]) ?? 0) : [];
  const totals = totalRow ? countColumns.map((column) => toNumber(totalRow[column.index])) : [];

  return {
    semester,
    dates: countColumns.map((column) => column.iso),
    properties,
    totals,
    marketCapacity,
    marketSold,
    skipped,
  };
}

export function monthlySeries(dates, values, asOf) {
  const points = dates
    .map((iso, index) => ({ iso, value: values[index] ?? 0 }))
    .filter((point) => point.iso <= asOf);
  if (!points.length) return [];
  const byMonth = new Map();
  for (const point of points) byMonth.set(point.iso.slice(0, 7), point.value);

  const first = points[0].iso;
  let year = Number(first.slice(0, 4));
  let month = Number(first.slice(5, 7)) - 1;
  if (month < 1) {
    year = Number(first.slice(0, 4));
    month = 1;
  }
  const endYear = Number(asOf.slice(0, 4));
  const endMonth = Number(asOf.slice(5, 7));
  const series = [];
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    series.push({ label: monthLabel(`${key}-01`), value: byMonth.get(key) ?? 0 });
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return series;
}

function nearestDate(dates, target) {
  const sorted = [...dates].sort();
  let best = sorted[0];
  let bestDelta = Infinity;
  for (const iso of sorted) {
    const delta = Math.abs(Date.parse(iso) - Date.parse(target));
    const preferEarlier = delta === bestDelta && iso < best;
    if (delta < bestDelta || preferEarlier) {
      best = iso;
      bestDelta = delta;
    }
  }
  return best ?? null;
}

function addYears(iso, years) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y + years, m - 1, d));
  return date.toISOString().slice(0, 10);
}

function resolveAsOf(dates, requested) {
  if (!dates.length) throw new Error("Tracker has no date columns.");
  if (!requested) return dates[dates.length - 1];
  if (!dates.includes(requested)) {
    throw new Error(`As-of ${requested} is not a column. Dates: ${dates.join(", ")}`);
  }
  return requested;
}

function countMapFromFile(file, aliasIndex) {
  if (!file) return new Map();
  const json = readJson(file);
  const source = json.counts ?? json.properties ?? json;
  const map = new Map();
  if (!source || typeof source !== "object" || Array.isArray(source)) return map;
  for (const [name, raw] of Object.entries(source)) {
    if (name === "date" || name === "lease" || name === "total" || name === "note" || name === "notes") continue;
    const property = lookupProperty(aliasIndex, name);
    if (!property) continue;
    const value =
      typeof raw === "number"
        ? raw
        : raw && typeof raw === "object"
          ? toNumber(raw.count ?? raw.filled ?? raw.value)
          : toNumber(raw);
    if (value == null) continue;
    map.set(property.id, value);
  }
  return map;
}

function countsJsonToProperties(file, aliasIndex) {
  const json = readJson(file);
  const source = json.properties ?? {};
  const properties = [];
  const unmapped = [];
  for (const [name, raw] of Object.entries(source)) {
    const property = lookupProperty(aliasIndex, name);
    const filled = typeof raw === "number" ? raw : toNumber(raw?.filled ?? raw?.count ?? raw);
    if (!property || filled == null) {
      unmapped.push(name);
      continue;
    }
    properties.push({
      id: property.id,
      sourceName: name,
      capacity: property.capacity,
      filled,
    });
  }
  return {
    semester: json.lease ?? json.semester ?? "Semester",
    reportDate: json.date ?? null,
    total: json.total ?? null,
    properties,
    unmapped,
  };
}

function marketFromFile(file) {
  if (!file) return null;
  const json = readJson(file);
  if (typeof json.sold === "number") return { sold: json.sold, capacity: json.capacity ?? null };
  const nested = json.winter_2027 ?? json.spring_2027 ?? json.fall_2026 ?? null;
  if (nested && typeof nested.market === "number") return { sold: nested.market, capacity: null };
  return null;
}

function topMover(deltas, category) {
  const rows = deltas.filter((row) => row.category === category);
  if (!rows.length) return { label: "\u2014", count: 0 };
  const best = Math.max(...rows.map((row) => row.delta));
  const leaders = rows.filter((row) => row.delta === best);
  if (leaders.length > 1) return { label: "There was a tie", count: best };
  return { label: leaders[0].name, count: best };
}

function blankReport(semester, reportDate) {
  return {
    semester,
    reportDate,
    capacity: 0,
    callouts: { totalContracts: 0, bnh: 0, women: null, men: null, market: null, decimals: 0 },
    monthlyContracts: [],
    properties: {},
    lastYear: null,
    highlights: {
      contractsSoldThisWeek: 0,
      houses: { label: "\u2014", count: 0 },
      apartments: { label: "\u2014", count: 0 },
      marketCapacity: 0,
      marketSold: 0,
      women: null,
      men: null,
      market: null,
      decimals: 0,
      monthlyMarketBeds: [],
    },
    goals: {},
    nextSemester: null,
    community: {},
    warnings: [],
  };
}

function ratio(part, whole) {
  if (!whole) return 0;
  return part / whole;
}

/**
 * Assemble a report.json object. `tracker` is the return value of parseTracker,
 * or null when the only input is an aggregated counts file.
 */
export function buildReport({
  teams,
  tracker = null,
  asOf = null,
  countsFile = null,
  unapprovedFile = null,
  inactiveFile = null,
  marketFile = null,
  editorial = null,
  previous = null,
  lastYearTracker = null,
  nextTracker = null,
  nextAsOf = null,
}) {
  const aliasIndex = buildAliasIndex(teams);
  const warnings = [];
  let semester = tracker?.semester ?? "Semester";
  let reportDate = asOf;
  let capacity = teams.properties.reduce((sum, property) => sum + property.capacity, 0);
  const propertyOrder = teams.properties.map((property) => property.id);
  const byId = new Map(teams.properties.map((property) => [property.id, property]));

  const filled = new Map();
  const capacities = new Map(teams.properties.map((property) => [property.id, property.capacity]));
  let dates = [];
  let dateIndex = -1;
  let previousIndex = -1;
  let marketSoldSeries = [];
  let marketCapacity = teams.marketCapacity ?? null;

  if (tracker) {
    dates = tracker.dates;
    reportDate = resolveAsOf(dates, asOf ?? reportDate);
    dateIndex = dates.indexOf(reportDate);
    previousIndex = dateIndex > 0 ? dateIndex - 1 : -1;
    semester = tracker.semester || semester;
    if (tracker.marketCapacity) marketCapacity = tracker.marketCapacity;
    marketSoldSeries = tracker.marketSold;
    let summed = 0;
    for (const row of tracker.properties) {
      const property = lookupProperty(aliasIndex, row.sourceName);
      if (!property) {
        warnings.push(`Unmapped tracker property: ${row.sourceName}`);
        continue;
      }
      filled.set(property.id, row.counts[dateIndex] ?? 0);
      if (row.capacity != null) capacities.set(property.id, row.capacity);
      summed += row.counts[dateIndex] ?? 0;
    }
    const checksum = tracker.totals[dateIndex];
    if (checksum != null && checksum !== summed) {
      warnings.push(`Property sum ${summed} does not match Total row ${checksum} on ${reportDate}.`);
    }
    capacity = [...capacities.values()].reduce((sum, value) => sum + value, 0);
  } else if (countsFile) {
    const aggregated = countsJsonToProperties(countsFile, aliasIndex);
    semester = aggregated.semester || semester;
    reportDate = reportDate || aggregated.reportDate;
    for (const row of aggregated.properties) {
      filled.set(row.id, row.filled);
      capacities.set(row.id, row.capacity);
    }
    aggregated.unmapped.forEach((name) => warnings.push(`Unmapped counts property: ${name}`));
    const summed = [...filled.values()].reduce((sum, value) => sum + value, 0);
    if (aggregated.total != null && aggregated.total !== summed) {
      warnings.push(`Counts JSON total ${aggregated.total} does not match mapped sum ${summed}.`);
    }
    capacity = [...capacities.values()].reduce((sum, value) => sum + value, 0);
  } else {
    throw new Error("Pass --tracker or --counts.");
  }

  if (!reportDate) throw new Error("Could not determine a report date. Pass --as-of YYYY-MM-DD.");

  const unapproved = countMapFromFile(unapprovedFile, aliasIndex);
  const inactive = countMapFromFile(inactiveFile, aliasIndex);
  if (tracker && dateIndex >= 0) {
    for (const row of tracker.properties) {
      const property = lookupProperty(aliasIndex, row.sourceName);
      if (!property) continue;
      if (row.unapproved && row.unapproved[reportDate] != null && !unapproved.has(property.id)) {
        unapproved.set(property.id, row.unapproved[reportDate]);
      }
    }
  }

  const contractsTotal = propertyOrder.reduce((sum, id) => sum + (filled.get(id) ?? 0), 0);
  const computedMonthly = tracker ? monthlySeries(dates, sumCounts(tracker, aliasIndex, propertyOrder), reportDate) : [];
  const marketMonthly = tracker
    ? monthlySeries(dates, marketSoldSeries, reportDate)
    : [];
  const marketSold = tracker && dateIndex >= 0 ? (marketSoldSeries[dateIndex] ?? 0) : (marketFromFile(marketFile)?.sold ?? previous?.highlights?.marketSold ?? 0);
  const fileMarket = marketFromFile(marketFile);
  const resolvedMarketSold = fileMarket?.sold ?? marketSold;
  const resolvedMarketCapacity = fileMarket?.capacity ?? marketCapacity ?? teams.marketCapacity ?? 0;

  const deltas = [];
  if (tracker && previousIndex >= 0) {
    for (const row of tracker.properties) {
      const property = lookupProperty(aliasIndex, row.sourceName);
      if (!property) continue;
      deltas.push({
        id: property.id,
        name: property.name,
        category: property.category,
        delta: (row.counts[dateIndex] ?? 0) - (row.counts[previousIndex] ?? 0),
      });
    }
  }
  const weekTotal = deltas.reduce((sum, row) => sum + row.delta, 0);

  const goals = {};
  for (const team of teams.teams) {
    const week = team.propertyIds.reduce((sum, id) => sum + (deltas.find((row) => row.id === id)?.delta ?? 0), 0);
    goals[team.id] = { week, month: week };
  }

  const properties = {};
  for (const id of propertyOrder) {
    properties[id] = {
      filled: filled.get(id) ?? 0,
      capacity: capacities.get(id) ?? byId.get(id)?.capacity ?? 0,
      unapproved: unapproved.get(id) ?? 0,
      inactive: inactive.get(id) ?? 0,
      lastYear: null,
    };
  }

  const report = blankReport(semester, reportDate);
  report.capacity = capacity;
  report.warnings = warnings;
  report.properties = properties;
  report.monthlyContracts = computedMonthly;
  report.callouts = {
    totalContracts: capacity,
    bnh: ratio(contractsTotal, capacity),
    women: null,
    men: null,
    market: resolvedMarketCapacity ? ratio(resolvedMarketSold, resolvedMarketCapacity) : null,
    decimals: 0,
  };
  report.highlights = {
    contractsSoldThisWeek: weekTotal,
    houses: deltas.length ? topMover(deltas, "house") : { label: "\u2014", count: 0 },
    apartments: deltas.length ? topMover(deltas, "apt") : { label: "\u2014", count: 0 },
    marketCapacity: resolvedMarketCapacity,
    marketSold: resolvedMarketSold,
    women: null,
    men: null,
    market: resolvedMarketCapacity ? ratio(resolvedMarketSold, resolvedMarketCapacity) : null,
    decimals: 0,
    monthlyMarketBeds: marketMonthly,
  };
  report.goals = goals;
  report.community = {};

  if (lastYearTracker) {
    const target = addYears(reportDate, -1);
    const lyDate = nearestDate(lastYearTracker.dates, target);
    const lyIndex = lastYearTracker.dates.indexOf(lyDate);
    const byProperty = {};
    let lyFilled = 0;
    let lyCapacity = 0;
    for (const row of lastYearTracker.properties) {
      const property = lookupProperty(aliasIndex, row.sourceName);
      if (!property) continue;
      const value = row.counts[lyIndex] ?? 0;
      byProperty[property.id] = value;
      lyFilled += value;
      lyCapacity += row.capacity ?? 0;
    }
    const lyMarketSold = lastYearTracker.marketSold[lyIndex] ?? 0;
    const lyMarketCapacity = lastYearTracker.marketCapacity ?? resolvedMarketCapacity;
    report.lastYear = {
      bnh: ratio(lyFilled, lyCapacity || capacity),
      market: lyMarketCapacity ? ratio(lyMarketSold, lyMarketCapacity) : null,
      decimals: 0,
      monthlyContracts: monthlySeries(
        lastYearTracker.dates,
        sumCounts(lastYearTracker, aliasIndex, propertyOrder),
        lyDate,
      ),
      byProperty,
    };
  }

  if (nextTracker) {
    const nextDate = resolveAsOf(nextTracker.dates, nextAsOf ?? null);
    const nextIndex = nextTracker.dates.indexOf(nextDate);
    const nextProperties = {};
    let nextFilled = 0;
    let nextCapacity = 0;
    for (const row of nextTracker.properties) {
      const property = lookupProperty(aliasIndex, row.sourceName);
      if (!property) {
        warnings.push(`Unmapped next-semester property: ${row.sourceName}`);
        continue;
      }
      const value = row.counts[nextIndex] ?? 0;
      const cap = row.capacity ?? property.capacity;
      nextProperties[property.id] = { filled: value, capacity: cap };
      nextFilled += value;
      nextCapacity += cap;
    }
    const nextMarketSold = nextTracker.marketSold[nextIndex] ?? 0;
    const nextMarketCapacity = nextTracker.marketCapacity ?? resolvedMarketCapacity;
    report.nextSemester = {
      semester: nextTracker.semester,
      reportDate: nextDate,
      capacity: nextCapacity,
      callouts: {
        totalContracts: nextCapacity,
        bnh: ratio(nextFilled, nextCapacity),
        market: nextMarketCapacity ? ratio(nextMarketSold, nextMarketCapacity) : null,
        decimals: 1,
      },
      monthlyContracts: monthlySeries(
        nextTracker.dates,
        sumCounts(nextTracker, aliasIndex, propertyOrder),
        nextDate,
      ),
      properties: nextProperties,
    };
  }

  applyPrevious(report, previous);
  applyEditorial(report, editorial);
  return report;
}

function sumCounts(tracker, aliasIndex, propertyOrder) {
  const known = new Set(propertyOrder);
  return tracker.dates.map((_, index) =>
    tracker.properties.reduce((sum, row) => {
      const property = lookupProperty(aliasIndex, row.sourceName);
      if (!property || !known.has(property.id)) return sum;
      return sum + (row.counts[index] ?? 0);
    }, 0),
  );
}

function applyPrevious(report, previous) {
  if (!previous) return;
  if (!report.lastYear && previous.lastYear) report.lastYear = previous.lastYear;
  if (previous.community && Object.keys(report.community).length === 0) report.community = previous.community;
  if (report.callouts.women == null && previous.callouts?.women != null) report.callouts.women = previous.callouts.women;
  if (report.callouts.men == null && previous.callouts?.men != null) report.callouts.men = previous.callouts.men;
  if (report.highlights.women == null && previous.highlights?.women != null) report.highlights.women = previous.highlights.women;
  if (report.highlights.men == null && previous.highlights?.men != null) report.highlights.men = previous.highlights.men;
  for (const [id, property] of Object.entries(report.properties)) {
    if (property.lastYear == null && previous.properties?.[id]?.lastYear != null) {
      property.lastYear = previous.properties[id].lastYear;
    }
  }
}

function applyEditorial(report, editorial) {
  if (!editorial) return;
  if (editorial.callouts) {
    report.callouts = { ...report.callouts, ...editorial.callouts };
  }
  if (editorial.monthlyContracts) report.monthlyContracts = editorial.monthlyContracts;
  if (editorial.lastYear) {
    report.lastYear = {
      bnh: editorial.lastYear.bnh,
      market: editorial.lastYear.market,
      decimals: editorial.lastYear.decimals ?? 0,
      monthlyContracts: editorial.lastYear.monthlyContracts ?? report.lastYear?.monthlyContracts ?? [],
    };
    const byProperty = editorial.lastYear.byProperty ?? {};
    for (const [id, value] of Object.entries(byProperty)) {
      if (!report.properties[id]) continue;
      report.properties[id].lastYear = value;
    }
  }
  if (editorial.highlights) {
    const { monthlyMarketBeds, ...rest } = editorial.highlights;
    report.highlights = {
      ...report.highlights,
      ...rest,
      monthlyMarketBeds: monthlyMarketBeds ?? report.highlights.monthlyMarketBeds,
    };
  }
  if (editorial.goals) report.goals = editorial.goals;
  if (editorial.community) report.community = editorial.community;
  if (editorial.nextSemester && report.nextSemester) {
    if (editorial.nextSemester.callouts) {
      report.nextSemester.callouts = { ...report.nextSemester.callouts, ...editorial.nextSemester.callouts };
    }
    if (editorial.nextSemester.monthlyContracts) {
      report.nextSemester.monthlyContracts = editorial.nextSemester.monthlyContracts;
    }
    for (const [id, patch] of Object.entries(editorial.nextSemester.properties ?? {})) {
      if (!report.nextSemester.properties[id]) continue;
      report.nextSemester.properties[id] = { ...report.nextSemester.properties[id], ...patch };
    }
  }
}

export function fetchTrackerFromSheets() {
  throw new Error(
    [
      "Live Google Sheets reads are stubbed in v1.",
      "Export the tab yourself (File \u2192 Download \u2192 Comma-separated values) and pass --tracker.",
      "Spreadsheet: Rexburg Real Estate Database",
      "ID: 1gLi53sg64WOoLf0LsCB1wTmsfQGZoeS4QTE3pjqy98c",
      "Tabs: contract_tracker - W27 and contract_tracker - S27.",
      "Do not grant this script write access to the sheet.",
    ].join(" "),
  );
}

function argValue(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

function printHelp() {
  console.log(`Usage: node scripts/build-from-sheet.mjs [options]

  --tracker <csv>         contract_tracker export for the semester being reported
  --as-of <YYYY-MM-DD>    snapshot date (default: latest date column)
  --next <csv>            following semester tracker (Winter while reporting Fall, \u2026)
  --next-as-of <date>     snapshot date inside --next (default: latest)
  --counts <json>         aggregated property counts, instead of a tracker CSV
  --unapproved <json>     green numbers (skipped when the CSV already has a duplicate date)
  --inactive <json>       blue numbers (inactive leads)
  --market <json>         market beds sold, when not using the tracker market row
  --last-year <csv>       prior-year tracker used for the comparison page
  --editorial <json>      pinned chart labels, goals, community, YoY overrides
  --previous <json>       last report.json; carries community and callouts forward
  --teams <json>          default config/teams.json
  --out <file>            write the report JSON here
  --write                 write data/report.json and data/archive/<date>.json
  --help

Live Sheets API is intentionally stubbed. This script never writes to the spreadsheet.`);
}

export function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return null;
  }
  const teams = loadTeams(path.resolve(argValue(argv, "--teams") ?? path.join(ROOT, "config/teams.json")));
  const trackerPath = argValue(argv, "--tracker");
  const countsPath = argValue(argv, "--counts");
  const tracker = trackerPath ? parseTracker(fs.readFileSync(path.resolve(trackerPath), "utf8")) : null;
  const nextPath = argValue(argv, "--next");
  const lastYearPath = argValue(argv, "--last-year");
  const editorialPath = argValue(argv, "--editorial");
  const previousPath = argValue(argv, "--previous");
  const report = buildReport({
    teams,
    tracker,
    asOf: argValue(argv, "--as-of"),
    countsFile: countsPath ? path.resolve(countsPath) : null,
    unapprovedFile: argValue(argv, "--unapproved") ? path.resolve(argValue(argv, "--unapproved")) : null,
    inactiveFile: argValue(argv, "--inactive") ? path.resolve(argValue(argv, "--inactive")) : null,
    marketFile: argValue(argv, "--market") ? path.resolve(argValue(argv, "--market")) : null,
    editorial: editorialPath ? readJson(path.resolve(editorialPath)) : null,
    previous: previousPath ? readJson(path.resolve(previousPath)) : null,
    lastYearTracker: lastYearPath ? parseTracker(fs.readFileSync(path.resolve(lastYearPath), "utf8")) : null,
    nextTracker: nextPath ? parseTracker(fs.readFileSync(path.resolve(nextPath), "utf8")) : null,
    nextAsOf: argValue(argv, "--next-as-of"),
  });
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const outFlag = argValue(argv, "--out");
  if (argv.includes("--write") || outFlag) {
    const outPath = path.resolve(outFlag ?? path.join(ROOT, "data/report.json"));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json);
    if (argv.includes("--write")) {
      const archivePath = path.join(ROOT, "data/archive", `${report.reportDate}.json`);
      fs.mkdirSync(path.dirname(archivePath), { recursive: true });
      fs.writeFileSync(archivePath, json);
    }
    console.log(`Wrote ${path.relative(ROOT, outPath)} (${report.semester}, ${report.reportDate}).`);
    for (const warning of report.warnings) console.warn(`warning: ${warning}`);
  } else {
    process.stdout.write(json);
  }
  return report;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
