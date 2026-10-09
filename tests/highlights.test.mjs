import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { resolveHighlights } from "../lib/highlights.mjs";

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
