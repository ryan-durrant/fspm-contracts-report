#!/usr/bin/env node
/**
 * Turn a community-housing manager email into counts for page 7.
 *
 * Bob saves the plain-text body himself. This script does not read Gmail.
 * Free-text notes are ignored. They often name residents, and this repo is
 * public, so only filled/capacity, office totals, asOf, and lease-start
 * dates are written. A lease start is "start date of December 1", with a
 * unit name when the email names the unit. Resident names are never stored.
 * A start date already on a card carries forward when a later email does
 * not give a new one.
 *
 *   node scripts/parse-community-housing.mjs --body email.txt --as-of 2026-10-02 --write
 *
 * If no body is passed, or --as-of is not newer than data/community-housing.json,
 * the stored counts stay.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUT = path.join(ROOT, "data/community-housing.json");

/** Email labels that are not the card title in config/teams.json. */
const EXTRA_ALIASES = [
  ["Liberty Corner House", "lc-house"],
  ["Red Brick House", "lc-house"],
  ["Liberty Corner", "liberty-corner"],
  ["LC Duplex", "lc-duplex"],
  ["LC House", "lc-house"],
  ["LC II", "lc-ii"],
  ["LC 2", "lc-ii"],
  ["LC 1", "liberty-corner"],
  ["LCII", "lc-ii"],
  ["LCD", "lc-duplex"],
  ["LC", "liberty-corner"],
  ["#122 Classic", "classic-122"],
];

export function normalizeLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/#/g, " # ")
    .replace(/[^a-z0-9#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadTeams(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function communityAliases(teams) {
  const aliases = [];
  for (const office of teams.offices ?? []) {
    for (const property of office.properties) {
      aliases.push({ id: property.id, norm: normalizeLabel(property.name), label: property.name });
    }
  }
  for (const [label, id] of EXTRA_ALIASES) {
    aliases.push({ id, norm: normalizeLabel(label), label });
  }
  aliases.sort((a, b) => b.norm.length - a.norm.length);
  return aliases;
}

function suffixAlias(gap, aliases) {
  const norm = normalizeLabel(gap);
  for (const alias of aliases) {
    if (norm === alias.norm || norm.endsWith(` ${alias.norm}`)) return alias;
  }
  return null;
}

function guessName(gap) {
  let text = String(gap).replace(/\s+/g, " ").trim();
  const paren = text.lastIndexOf(")");
  if (paren !== -1) text = text.slice(paren + 1).trim();
  const titled = text.match(/((?:[#A-Z0-9][\w#]*)(?:\s+[#A-Z0-9][\w#]*){0,5})\s*$/);
  if (titled) return titled[1].trim();
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(-4).join(" ");
}

/**
 * Parse an email body into property counts. Notes are discarded.
 * `unrecognized` is the property label only, never the note text.
 */
const UNIT_WORDS = ["upstairs", "downstairs", "basement", "main floor"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function titleUnit(word) {
  return word
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function monthIndex(name) {
  const lower = String(name ?? "").toLowerCase();
  return MONTHS.findIndex((month) => month.toLowerCase() === lower);
}

/**
 * Pull lease-start and move-in dates out of the words after a count.
 * Only an allow-listed unit word is kept with the date. Other words,
 * including resident names, are dropped.
 */
export function leaseStartsFromTail(tail) {
  const text = String(tail ?? "").replace(/\s+/g, " ");
  const starts = [];
  const seen = new Set();
  const add = (unitWord, month, day) => {
    const monthNumber = typeof month === "number" ? month : monthIndex(month);
    const dayNumber = Number(day);
    if (monthNumber < 0 || monthNumber > 11 || !dayNumber || dayNumber > 31) return;
    const unit = unitWord ? titleUnit(unitWord) : undefined;
    const entry = { text: `start date of ${MONTHS[monthNumber]} ${dayNumber}` };
    if (unit) entry.unit = unit;
    const key = `${entry.unit ?? ""}|${entry.text}`;
    if (seen.has(key)) return;
    seen.add(key);
    starts.push(entry);
  };
  const unit = `(?:\\b(${UNIT_WORDS.join("|")})\\b(?:\\s+\\w+){0,3}?\\s+)?`;
  const numeric = new RegExp(`${unit}\\bleased for\\s+(\\d{1,2})\\/(\\d{1,2})(?:\\/\\d{2,4})?`, "gi");
  const named = new RegExp(
    `${unit}\\b(?:leased for|moving in)\\s+([A-Za-z]+)\\s+(\\d{1,2})(?:st|nd|rd|th)?`,
    "gi",
  );
  for (const pattern of [numeric, named]) {
    for (const match of text.matchAll(pattern)) {
      add(match[1], pattern === numeric ? Number(match[2]) - 1 : match[2], pattern === numeric ? match[3] : match[3]);
    }
  }
  return starts;
}

export function parseCommunityBody(body, teams) {
  const aliases = communityAliases(teams);
  const found = new Map();
  const unrecognized = [];
  const source = String(body ?? "").replace(/\r\n/g, "\n");
  const ratio = /-\s*(\d+)\s*\/\s*(\d+)/g;
  const matches = [...source.matchAll(ratio)];
  matches.forEach((match, index) => {
    const cursor = index === 0 ? 0 : matches[index - 1].index + matches[index - 1][0].length;
    const gap = source.slice(cursor, match.index);
    const filled = Number(match[1]);
    const capacity = Number(match[2]);
    const tailEnd = matches[index + 1]?.index ?? source.length;
    const tail = source.slice(match.index + match[0].length, tailEnd);
    const alias = suffixAlias(gap, aliases);
    if (alias) {
      const row = { filled, capacity };
      const leaseStarts = leaseStartsFromTail(tail);
      if (leaseStarts.length) row.leaseStarts = leaseStarts;
      found.set(alias.id, row);
    } else {
      const name = guessName(gap);
      if (name) unrecognized.push(name);
    }
  });
  return { found, unrecognized };
}

export function officeTotals(teams, properties) {
  const offices = {};
  for (const office of teams.offices ?? []) {
    let filled = 0;
    let capacity = 0;
    for (const property of office.properties) {
      const row = properties[property.id];
      if (!row) continue;
      filled += row.filled;
      capacity += row.capacity;
    }
    offices[office.id] = { name: office.name, filled, capacity };
  }
  return offices;
}

function cardDefaults(teams) {
  const properties = {};
  for (const office of teams.offices ?? []) {
    for (const property of office.properties) {
      properties[property.id] = { filled: 0, capacity: property.capacity };
    }
  }
  return properties;
}

/**
 * Build the community-housing document.
 * No body, or an as-of date that is not newer than `previous`, keeps `previous`.
 * Cards missing from a newer email keep the stored count.
 */
export function buildCommunityDocument({ teams, body, asOf, previous = null }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf ?? "")) {
    throw new Error(`As-of date must be YYYY-MM-DD. Received ${asOf ?? "(missing)"}.`);
  }
  if (body == null || (previous?.asOf && asOf <= previous.asOf)) {
    return {
      document: previous ?? { asOf, properties: {}, offices: {} },
      unrecognized: [],
      kept: [],
      carriedForward: true,
    };
  }
  const parsed = parseCommunityBody(body, teams);
  const properties = { ...cardDefaults(teams) };
  const keepSchedule = (target, source) => {
    if (!source) return;
    if (source.leaseStarts?.length) target.leaseStarts = source.leaseStarts;
    else if (source.note) target.note = source.note;
  };
  if (previous?.properties) {
    for (const [id, row] of Object.entries(previous.properties)) {
      if (!properties[id] || !row) continue;
      properties[id] = { filled: row.filled, capacity: row.capacity };
      keepSchedule(properties[id], row);
    }
  }
  for (const [id, row] of parsed.found) {
    if (!properties[id]) continue;
    const carried = properties[id];
    properties[id] = { filled: row.filled, capacity: row.capacity };
    if (row.leaseStarts?.length) properties[id].leaseStarts = row.leaseStarts;
    else keepSchedule(properties[id], carried);
  }
  const seen = new Set(parsed.found.keys());
  const kept = [];
  for (const office of teams.offices ?? []) {
    for (const property of office.properties) {
      if (!seen.has(property.id)) kept.push(property.name);
    }
  }
  return {
    document: {
      asOf,
      properties,
      offices: officeTotals(teams, properties),
    },
    unrecognized: parsed.unrecognized,
    kept,
    carriedForward: false,
  };
}

function readStored(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function argValue(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

function printHelp() {
  console.log(`Usage: node scripts/parse-community-housing.mjs [options]

  --body <file>          plain-text email body (or pipe the body on stdin)
  --as-of <YYYY-MM-DD>   email date. Required.
  --stored <json>        last community-housing.json (default: the output file)
  --teams <json>         default config/teams.json
  --out <file>           write here instead of data/community-housing.json
  --write                write the JSON file
  --help

Resident names and other notes are not stored. A lease start or move-in
date is stored as leaseStarts ("start date of December 1", plus a unit
name when the email names the unit) and carries forward when a later
email does not replace it. If there is no body, or --as-of is not newer
than the stored file, the stored counts are kept and nothing is written.`);
}

export function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return null;
  }
  const asOf = argValue(argv, "--as-of");
  const teams = loadTeams(path.resolve(argValue(argv, "--teams") ?? path.join(ROOT, "config/teams.json")));
  const outPath = path.resolve(argValue(argv, "--out") ?? DEFAULT_OUT);
  const storedPath = path.resolve(argValue(argv, "--stored") ?? outPath);
  const previous = readStored(storedPath);
  let body = null;
  const bodyFlag = argValue(argv, "--body");
  if (bodyFlag) {
    body = fs.readFileSync(path.resolve(bodyFlag), "utf8");
  } else if (!process.stdin.isTTY) {
    body = fs.readFileSync(0, "utf8");
  }
  const result = buildCommunityDocument({ teams, body, asOf, previous });
  for (const name of result.unrecognized) {
    console.error(`unrecognized community property: ${name}`);
  }
  for (const name of result.kept) {
    console.error(`not in this email, kept the stored count: ${name}`);
  }
  if (result.carriedForward) {
    console.error(
      previous
        ? `Kept community housing as of ${previous.asOf}.`
        : "No community housing email was provided, and there is no stored file.",
    );
  }
  const json = `${JSON.stringify(result.document, null, 2)}\n`;
  const shouldWrite = argv.includes("--write") || argValue(argv, "--out");
  if (!result.carriedForward && shouldWrite) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json);
    console.log(`Wrote ${path.relative(ROOT, outPath)} (as of ${result.document.asOf}).`);
  } else if (!shouldWrite) {
    process.stdout.write(json);
  }
  return result;
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
