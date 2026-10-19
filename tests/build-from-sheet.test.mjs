import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  boiseDate,
  buildAliasIndex,
  buildReport,
  fetchTrackerFromSheets,
  genderOccupancy,
  monthToDateDelta,
  monthlySeries,
  normalizeName,
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
  const asOf = "2026-10-19";
  const index = tracker.dates.indexOf(asOf);
  assert.equal(tracker.totals[index], 665);
  const carriage = tracker.properties.find((row) => row.sourceName === "The Carriage House");
  assert.equal(carriage.counts[index], 234);
  assert.equal(carriage.unapproved[asOf], 0);
  const unapproved = tracker.properties.reduce((sum, row) => sum + (row.unapproved[asOf] ?? 0), 0);
  assert.equal(unapproved, 23);
  const october5 = tracker.dates.indexOf("2026-10-05");
  assert.equal(tracker.totals[october5], 620);
  assert.equal(carriage.counts[october5], 223);
  assert.equal(carriage.unapproved["2026-10-05"], undefined);
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

test("month-to-date actuals reset each month and keep negative deltas", () => {
  const dates = ["2026-09-28", "2026-10-05", "2026-10-12", "2026-11-02"];
  const counts = [62, 59, 63, 70];
  assert.equal(monthToDateDelta(dates, counts, "2026-10-12"), 1);
  assert.equal(monthToDateDelta(dates, counts, "2026-10-05"), -3);
  assert.equal(monthToDateDelta(dates, counts, "2026-09-28"), 0);
  assert.equal(monthToDateDelta(dates, counts, "2026-11-02"), 7);
  assert.equal(monthToDateDelta([], counts, "2026-10-12"), 0);
});

test("W27 goals month sums every approved week that ends in the report month", () => {
  const tracker = readTracker("contract_tracker-W27.csv");
  const index = buildAliasIndex(teams);
  const report = buildReport({ teams, tracker, asOf: "2026-10-12" });
  const dateIndex = tracker.dates.indexOf("2026-10-12");
  for (const team of teams.teams) {
    let month = 0;
    let week = 0;
    for (const id of team.propertyIds) {
      const source = tracker.properties.find((row) => index.get(normalizeName(row.sourceName))?.id === id);
      assert.ok(source, id);
      month += monthToDateDelta(tracker.dates, source.counts, "2026-10-12");
      week += source.counts[dateIndex] - source.counts[dateIndex - 1];
    }
    assert.equal(report.goals[team.id].month, month, team.id);
    assert.equal(report.goals[team.id].week, week, team.id);
  }
  assert.equal(report.goals["shalynn-kate"].week, 11);
  assert.equal(report.goals["kelsee-shaylee"].week, 15);
  assert.equal(report.goals["kenzie-lauren"].week, 11);
  assert.equal(report.goals["shalynn-kate"].month, 66);
  assert.equal(report.goals["kelsee-shaylee"].month, 24);
  assert.equal(report.goals["kenzie-lauren"].month, 51);

  const firstOctoberWeek = buildReport({ teams, tracker, asOf: "2026-10-05" });
  assert.equal(firstOctoberWeek.goals["shalynn-kate"].month, 55);
  assert.equal(firstOctoberWeek.goals["kelsee-shaylee"].month, 9);
  assert.equal(firstOctoberWeek.goals["kenzie-lauren"].month, 40);
  assert.equal(firstOctoberWeek.goals["shalynn-kate"].week, firstOctoberWeek.goals["shalynn-kate"].month);

  const october19 = buildReport({ teams, tracker, asOf: "2026-10-19" });
  assert.equal(october19.goals["shalynn-kate"].week, 0);
  assert.equal(october19.goals["kelsee-shaylee"].week, 4);
  assert.equal(october19.goals["kenzie-lauren"].week, 4);
  assert.equal(october19.goals["shalynn-kate"].month, 66);
  assert.equal(october19.goals["kelsee-shaylee"].month, 28);
  assert.equal(october19.goals["kenzie-lauren"].month, 55);
});

test("gender split apportions 10/19 approved contracts and a week file can pin the cover", () => {
  const split = JSON.parse(fs.readFileSync(path.join(root, "config/gender-split.json"), "utf8"));
  const tracker = readTracker("contract_tracker-W27.csv");
  const computed = buildReport({ teams, tracker, asOf: "2026-10-19" });
  const blue = 122;
  const womenFilled = 234 + 8 + 14 + 65 + 7 + 5 + blue * (92 / 140) + 47 * (24 / 48) + 42 * (24 / 48);
  const womenCapacity = 234 + 8 + 14 + 66 + 7 + 7 + 92 + 24 + 24;
  const menFilled = 75 + 24 + 4 + 12 + 6 + blue * (48 / 140) + 47 * (24 / 48) + 42 * (24 / 48);
  const menCapacity = 79 + 24 + 6 + 12 + 7 + 48 + 24 + 24;
  assert.equal(womenCapacity, 476);
  assert.equal(menCapacity, 224);
  assert.equal(womenFilled + menFilled, 665);
  const direct = genderOccupancy(computed.properties, split);
  assert.equal(direct.women, womenFilled / womenCapacity);
  assert.equal(direct.men, menFilled / menCapacity);
  assert.equal(computed.callouts.women, direct.women);
  assert.equal(computed.callouts.men, direct.men);
  assert.equal((computed.callouts.women * 100).toFixed(0), "96");
  assert.equal((computed.callouts.men * 100).toFixed(0), "93");
  assert.deepEqual(direct.warnings, []);

  const pinned = buildReport({
    teams,
    tracker,
    asOf: "2026-10-19",
    editorial: JSON.parse(fs.readFileSync(path.join(root, "data/weeks/2026-10-19.json"), "utf8")),
  });
  assert.equal(pinned.callouts.women, 0.96);
  assert.equal(pinned.callouts.men, 0.9);
});

test("report date follows America/Boise", () => {
  assert.equal(boiseDate(new Date("2026-10-12T05:00:00Z")), "2026-10-11");
  assert.equal(boiseDate(new Date("2026-10-12T06:00:00Z")), "2026-10-12");
});

test("live Sheets helper stays read-only and unimplemented", () => {
  assert.throws(() => fetchTrackerFromSheets(), /stubbed/);
});
