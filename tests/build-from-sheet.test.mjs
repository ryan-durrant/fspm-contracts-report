import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildReport,
  fetchTrackerFromSheets,
  monthlySeries,
  parseTracker,
  parseUsDate,
} from "../scripts/build-from-sheet.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const teams = JSON.parse(fs.readFileSync(path.join(root, "config/teams.json"), "utf8"));
const editorial = JSON.parse(fs.readFileSync(path.join(root, "data/editorial/f26-2026-08-24.json"), "utf8"));

function readTracker(name) {
  return parseTracker(fs.readFileSync(path.join(root, "data/samples", name), "utf8"));
}

test("parses US sheet dates", () => {
  assert.equal(parseUsDate("8/24/26"), "2026-08-24");
  assert.equal(parseUsDate("10/5/2026"), "2026-10-05");
  assert.equal(parseUsDate("notes"), null);
});

test("Fall 2026 tracker matches the 08/24 report totals", () => {
  const tracker = readTracker("contract_tracker-F26.csv");
  assert.equal(tracker.semester, "Fall 2026");
  const index = tracker.dates.indexOf("2026-08-24");
  assert.ok(index >= 0);
  const carriage = tracker.properties.find((row) => row.sourceName === "The Carriage House");
  assert.equal(carriage.counts[index], 231);
  assert.equal(carriage.capacity, 234);
  assert.equal(tracker.totals[index], 695);
  assert.equal(tracker.marketSold[index], 15686);
  assert.equal(tracker.marketCapacity, 16244);
  const series = monthlySeries(tracker.dates, tracker.totals, "2026-08-24");
  assert.deepEqual(
    series.map((point) => point.label),
    ["Jan-26", "Feb-26", "Mar-26", "Apr-26", "May-26", "Jun-26", "Jul-26", "Aug-26"],
  );
  assert.equal(series[0].value, 0);
  assert.equal(series[1].value, 283);
  assert.equal(series.at(-1).value, 695);
});

test("Winter 2027 duplicate date column is the unapproved count", () => {
  const tracker = readTracker("contract_tracker-W27.csv");
  const asOf = "2026-10-05";
  const index = tracker.dates.indexOf(asOf);
  assert.equal(tracker.totals[index], 620);
  const carriage = tracker.properties.find((row) => row.sourceName === "The Carriage House");
  assert.equal(carriage.counts[index], 223);
  assert.equal(carriage.unapproved[asOf], 11);
  const unapproved = tracker.properties.reduce((sum, row) => sum + (row.unapproved[asOf] ?? 0), 0);
  assert.equal(unapproved, 47);
  const august = tracker.dates.indexOf("2026-08-24");
  assert.equal(tracker.totals[august], 361);
  assert.equal(carriage.counts[august], 132);
  const series = monthlySeries(tracker.dates, tracker.totals, "2026-08-24");
  assert.deepEqual(series.map((point) => point.value), [0, 72, 168, 242, 284, 361]);
});

test("editorial build reproduces the published Fall 2026 report", () => {
  const report = buildReport({
    teams,
    tracker: readTracker("contract_tracker-F26.csv"),
    asOf: "2026-08-24",
    unapprovedFile: path.join(root, "data/samples/unapproved-f26.json"),
    inactiveFile: path.join(root, "data/samples/inactive-f26.json"),
    editorial,
    nextTracker: readTracker("contract_tracker-W27.csv"),
    nextAsOf: "2026-08-24",
  });
  assert.equal(report.semester, "Fall 2026");
  assert.equal(report.reportDate, "2026-08-24");
  assert.equal(report.properties["carriage-house"].filled, 231);
  assert.equal(report.properties["carriage-house"].unapproved, 2);
  assert.equal(report.properties["carriage-house"].inactive, 3);
  assert.equal(report.properties["haven-179"].inactive, 4);
  assert.equal(report.properties["haven-red"].unapproved, 1);
  assert.equal(report.properties["carriage-house"].lastYear, 233);
  assert.equal(report.monthlyContracts[1].value, 282);
  assert.equal(report.highlights.contractsSoldThisWeek, 8);
  assert.equal(report.highlights.apartments.label, "Haven Blue");
  assert.equal(report.highlights.houses.label, "There was a tie");
  assert.equal(report.nextSemester.semester, "Winter 2027");
  assert.equal(report.nextSemester.properties["carriage-house"].filled, 132);
  assert.equal(report.nextSemester.properties["haven-179"].filled, 5);
  assert.equal(report.nextSemester.monthlyContracts.at(-1).value, 361);
  assert.equal(report.nextSemester.callouts.bnh, 0.516);
  assert.equal(report.community["liberty-corner"], 17);
  const filled = Object.values(report.properties).reduce((sum, property) => sum + property.filled, 0);
  assert.equal(filled, 695);
  assert.deepEqual(report.warnings, []);
});

test("aggregated counts JSON maps sheet names onto report properties", () => {
  const report = buildReport({
    teams,
    countsFile: path.join(root, "data/samples/counts-w27.json"),
    unapprovedFile: path.join(root, "data/samples/unapproved-w27.json"),
    inactiveFile: path.join(root, "data/samples/inactive-w27.json"),
    marketFile: path.join(root, "data/samples/market-2026-10-05.json"),
    asOf: "2026-10-05",
  });
  assert.equal(report.reportDate, "2026-10-05");
  assert.equal(report.properties["carriage-house"].filled, 223);
  assert.equal(report.properties["carriage-house"].unapproved, 11);
  assert.equal(report.properties["haven-blue"].inactive, 17);
  assert.equal(report.highlights.marketSold, 9529);
  const filled = Object.values(report.properties).reduce((sum, property) => sum + property.filled, 0);
  assert.equal(filled, 620);
});

test("live Sheets helper stays read-only and unimplemented", () => {
  assert.throws(() => fetchTrackerFromSheets(), /stubbed/);
});
