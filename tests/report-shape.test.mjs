import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, "data/report.json"), "utf8"));

test("shipped report matches the 08/24/2026 PDF figures", () => {
  assert.equal(report.semester, "Fall 2026");
  assert.equal(report.reportDate, "2026-08-24");
  assert.equal(report.capacity, 700);
  const filled = Object.values(report.properties).reduce((sum, property) => sum + property.filled, 0);
  assert.equal(filled, 695);
  assert.equal(report.properties["carriage-house"].filled, 231);
  assert.equal(report.properties["haven-blue"].filled, 140);
  assert.equal(report.properties["haven-red"].filled, 47);
  assert.equal(report.properties["haven-149"].lastYear, 11);
  assert.deepEqual(
    report.monthlyContracts.map((point) => point.value),
    [0, 282, 510, 565, 668, 676, 687, 695],
  );
  assert.equal(report.highlights.marketSold, 15686);
  assert.equal(report.highlights.contractsSoldThisWeek, 8);
  assert.equal(report.goals["kenzie-lauren"].week, 6);
  assert.equal(report.nextSemester.properties["carriage-house"].filled, 132);
  assert.equal(report.nextSemester.properties["haven-179"].filled, 5);
  assert.deepEqual(
    report.nextSemester.monthlyContracts.map((point) => point.value),
    [0, 72, 168, 242, 284, 361],
  );
  assert.equal(report.community["liberty-corner"], 17);
  assert.equal(report.community["classic-122"], 1);
  assert.equal(report.warnings.length, 0);
});
