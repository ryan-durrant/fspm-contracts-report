import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadHighlightFile, resolveHighlights, standingRings } from "../lib/highlights.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const teams = JSON.parse(fs.readFileSync(path.join(root, "config/teams.json"), "utf8"));

test("10/5 demo rings the three unapproved counts", () => {
  const entries = JSON.parse(fs.readFileSync(path.join(root, "highlights/2026-10-05.json"), "utf8"));
  const warnings = [];
  const { rings } = resolveHighlights(entries, { teams, log: (message) => warnings.push(message) });
  assert.deepEqual(warnings, []);
  assert.deepEqual(
    rings.map((ring) => ring.id),
    [
      "w27:card:carriage-house:unapproved",
      "w27:card:haven-blue:unapproved",
      "w27:card:avonlea-men:unapproved",
    ],
  );
  assert.equal(rings.every((ring) => ring.color === "red"), true);
});

test("10/5 file is manual-only", () => {
  const file = loadHighlightFile("2026-10-05", root);
  assert.equal(file.rules, false);
  assert.equal(file.entries.length, 3);
});

test("standing rules ring Haven Blue inactive and the full Winter cards", () => {
  const rules = JSON.parse(fs.readFileSync(path.join(root, "config/highlight-rules.json"), "utf8"));
  const week = JSON.parse(fs.readFileSync(path.join(root, "data/weeks/2026-10-12.json"), "utf8"));
  const report = {
    properties: {
      "carriage-house": { filled: 234, capacity: 234, unapproved: 0, inactive: 2 },
      "carriage-townhouse": { filled: 8, capacity: 8, unapproved: 0, inactive: 0 },
      "avonlea-house": { filled: 14, capacity: 14, unapproved: 0, inactive: 0 },
      "avonlea-women": { filled: 63, capacity: 66, unapproved: 1, inactive: 3 },
      "haven-blue": { filled: 118, capacity: 140, unapproved: 8, inactive: 14 },
      "haven-179": { filled: 5, capacity: 7, unapproved: 1, inactive: 1 },
      "haven-175": { filled: 7, capacity: 7, unapproved: 0, inactive: 2 },
      "haven-163": { filled: 6, capacity: 7, unapproved: 0, inactive: 0 },
      "haven-149": { filled: 12, capacity: 12, unapproved: 0, inactive: 1 },
      "haven-white": { filled: 23, capacity: 24, unapproved: 1, inactive: 3 },
      "avonlea-men": { filled: 73, capacity: 79, unapproved: 5, inactive: 6 },
      "haven-129": { filled: 4, capacity: 6, unapproved: 2, inactive: 2 },
      "haven-green": { filled: 47, capacity: 48, unapproved: 1, inactive: 2 },
      "haven-red": { filled: 43, capacity: 48, unapproved: 3, inactive: 6 },
    },
    nextSemester: {
      properties: {
        "carriage-house": { filled: 78, capacity: 234 },
        "carriage-townhouse": { filled: 6, capacity: 8 },
      },
    },
  };
  const standing = standingRings(report, teams, rules).map((ring) => ring.id).sort();
  assert.deepEqual(standing, [
    "w27:card:avonlea-house:filled",
    "w27:card:carriage-house:filled",
    "w27:card:carriage-townhouse:filled",
    "w27:card:haven-149:filled",
    "w27:card:haven-175:filled",
    "w27:card:haven-blue:inactive",
  ]);
  assert.equal(standing.some((id) => id.startsWith("comparison:")), false);
  assert.equal(standing.some((id) => id.startsWith("s27:")), false);
  assert.equal(standing.filter((id) => id.endsWith(":unapproved")).length, 0);
  const file = loadHighlightFile("2026-10-12", root);
  assert.equal(file.rules, true);
  const manual = resolveHighlights(file.entries, { teams, log: () => {} });
  assert.deepEqual(
    manual.rings.map((ring) => `${ring.color}:${ring.id}`),
    [
      "red:community:card:liberty-corner:filled",
      "red:community:card:lc-ii:filled",
      "red:community:card:lc-duplex:filled",
      "yellow:community:card:classic-122:filled",
      "yellow:community:card:haven-green-townhouse:filled",
    ],
  );
  assert.equal(week.callouts.bnh, 0.94);
});

test("10/19 standing rules ring full Winter cards and skip comparison", () => {
  const rules = JSON.parse(fs.readFileSync(path.join(root, "config/highlight-rules.json"), "utf8"));
  const report = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-10-19.json"), "utf8"));
  const file = loadHighlightFile("2026-10-19", root);
  assert.equal(file.rules, true);
  assert.deepEqual(file.entries, []);
  const standing = standingRings(report, teams, rules).map((ring) => ring.id).sort();
  assert.deepEqual(standing, [
    "w27:card:avonlea-house:filled",
    "w27:card:carriage-house:filled",
    "w27:card:carriage-townhouse:filled",
    "w27:card:haven-149:filled",
    "w27:card:haven-175:filled",
    "w27:card:haven-white:filled",
  ]);
  assert.equal(standing.some((id) => id.startsWith("comparison:")), false);
  assert.equal(standing.some((id) => id.startsWith("s27:")), false);
});

test("10/26 standing rules ring full Winter cards and Haven Blue inactive", () => {
  const rules = JSON.parse(fs.readFileSync(path.join(root, "config/highlight-rules.json"), "utf8"));
  const report = JSON.parse(fs.readFileSync(path.join(root, "data/report.json"), "utf8"));
  const file = loadHighlightFile("2026-10-26", root);
  assert.equal(file.rules, true);
  assert.deepEqual(file.entries, []);
  const standing = standingRings(report, teams, rules).map((ring) => ring.id).sort();
  assert.deepEqual(standing, [
    "w27:card:avonlea-house:filled",
    "w27:card:carriage-townhouse:filled",
    "w27:card:haven-149:filled",
    "w27:card:haven-175:filled",
    "w27:card:haven-blue:inactive",
    "w27:card:haven-green:filled",
    "w27:card:haven-white:filled",
  ]);
  assert.equal(standing.some((id) => id.startsWith("comparison:")), false);
  assert.equal(standing.some((id) => id.startsWith("s27:")), false);
  assert.equal(standing.includes("w27:card:carriage-house:filled"), false);
});

test("unknown highlight targets are ignored", () => {
  const warnings = [];
  const { rings } = resolveHighlights(
    [
      { page: "w27", property: "not-a-house", field: "unapproved", color: "red" },
      { page: "attic", property: "haven-blue", field: "unapproved", color: "red" },
      { page: "w27", property: "haven-blue", field: "unapproved", color: "purple" },
      { field: "inactive", applyToAll: true, color: "yellow" },
    ],
    { teams, log: (message) => warnings.push(message) },
  );
  assert.equal(rings.some((ring) => ring.id.includes("not-a-house")), false);
  assert.equal(rings.filter((ring) => ring.id.endsWith(":inactive")).length, teams.properties.length);
  assert.equal(warnings.length, 3);
});
