#!/usr/bin/env node
/**
 * Turn a community-housing manager email into counts for page 7.
 *
 * Bob saves the plain-text body himself. This script does not read Gmail.
 * Free-text notes are ignored. They often name residents, and this repo is
 * public, so only filled/capacity, office totals, and asOf are written.
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
export function parseCommunityBody(body, teams) {
  const aliases = communityAliases(teams);
  const found = new Map();
  const unrecognized = [];
  const source = String(body ?? "").replace(/\r\n/g, "\n");
  const ratio = /-\s*(\d+)\s*\/\s*(\d+)/g;
  let cursor = 0;
  let match = ratio.exec(source);
  while (match) {
    const gap = source.slice(cursor, match.index);
    const filled = Number(match[1]);
    const capacity = Number(match[2]);
    const alias = suffixAlias(gap, aliases);
    if (alias) {
      found.set(alias.id, { filled, capacity });
    } else {
      const name = guessName(gap);
      if (name) unrecognized.push(name);
    }
    cursor = ratio.lastIndex;
    match = ratio.exec(source);
  }
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
  if (previous?.properties) {
    for (const [id, row] of Object.entries(previous.properties)) {
      if (!properties[id] || !row) continue;
      properties[id] = { filled: row.filled, capacity: row.capacity };
    }
  }
  for (const [id, row] of parsed.found) {
    if (!properties[id]) continue;
    properties[id] = { filled: row.filled, capacity: row.capacity };
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

Notes in the email are not stored. If there is no body, or --as-of is not newer
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
