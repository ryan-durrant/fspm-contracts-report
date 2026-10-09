import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, "data/report.json"), "utf8"));
const archive = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-08-24.json"), "utf8"));

const approved = {
  "carriage-house": [234, 223, 11, 8],
  "carriage-townhouse": [8, 8, 0, 0],
  "avonlea-house": [14, 14, 0, 1],
  "avonlea-women": [66, 59, 5, 9],
  "haven-blue": [140, 114, 11, 17],
  "haven-179": [7, 5, 1, 2],
  "haven-175": [7, 7, 0, 1],
  "haven-163": [7, 7, 0, 1],
  "haven-149": [12, 6, 3, 4],
  "haven-white": [24, 22, 2, 4],
  "avonlea-men": [79, 62, 8, 11],
  "haven-129": [6, 4, 1, 1],
  "haven-green": [48, 46, 2, 2],
  "haven-red": [48, 43, 3, 6],
};

test("shipped report is the 10/5/2026 Winter week", () => {
  assert.equal(report.semester, "Winter 2027");
  assert.equal(report.reportDate, "2026-10-05");
  assert.equal(report.capacity, 700);
  let filled = 0;
  let unapproved = 0;
  let inactive = 0;
  for (const [id, [capacity, approvedCount, green, blue]] of Object.entries(approved)) {
    const row = report.properties[id];
    assert.equal(row.capacity, capacity, id);
    assert.equal(row.filled, approvedCount, id);
    assert.equal(row.unapproved, green, id);
    assert.equal(row.inactive, blue, id);
    filled += approvedCount;
    unapproved += green;
    inactive += blue;
  }
  assert.equal(filled, 620);
  assert.equal(unapproved, 47);
  assert.equal(inactive, 67);
  assert.equal(Math.round(report.callouts.bnh * 100), 89);
  assert.equal(report.highlights.contractsSoldThisWeek, 104);
  assert.equal(report.highlights.marketSold, 9529);
  assert.equal(report.highlights.marketCapacity, 16244);
  assert.equal(Math.round(report.highlights.market * 100), 59);
  assert.equal(Math.round(report.highlights.women * 100), 58);
  assert.equal(Math.round(report.highlights.men * 100), 59);
  assert.equal(Math.round(report.callouts.market * 100), 59);
  assert.equal(report.callouts.women, null);
  assert.equal(report.callouts.men, null);
  assert.ok(report.highlights.monthlyMarketBeds.some((point) => point.value === 7997));
  assert.equal(report.highlights.monthlyMarketBeds.at(-1).value, 9529);
  assert.equal(report.nextSemester.semester, "Spring 2027");
  const nextFilled = Object.values(report.nextSemester.properties).reduce((sum, row) => sum + row.filled, 0);
  const nextCapacity = Object.values(report.nextSemester.properties).reduce((sum, row) => sum + row.capacity, 0);
  assert.equal(nextFilled, 195);
  assert.equal(nextCapacity, 701);
  assert.equal(report.nextSemester.properties["haven-149"].capacity, 13);
  assert.equal(report.nextSemester.properties["haven-149"].filled, 1);
  assert.equal(report.nextSemester.callouts.market, null);
  assert.equal(Math.round(report.nextSemester.callouts.bnh * 100), 28);
  assert.equal(report.communityHousing.asOf, "2026-10-02");
  assert.deepEqual(report.communityHousing.properties["liberty-corner"], { filled: 17, capacity: 18 });
  assert.deepEqual(report.communityHousing.properties["lc-ii"], { filled: 7, capacity: 8 });
  assert.deepEqual(report.communityHousing.properties["lc-house"], { filled: 3, capacity: 3 });
  assert.deepEqual(report.communityHousing.properties["lc-duplex"], { filled: 1, capacity: 2 });
  assert.deepEqual(report.communityHousing.properties["rock-casa"], { filled: 1, capacity: 1 });
  assert.deepEqual(report.communityHousing.offices["avonlea-office"], {
    name: "Avonlea Office",
    filled: 28,
    capacity: 31,
  });
  assert.deepEqual(report.communityHousing.offices["haven-office"], {
    name: "Haven Office",
    filled: 13,
    capacity: 15,
  });
  assert.match(report.tip.intro, /104 approved contracts/);
  assert.equal(JSON.stringify(report).includes("notes"), false);
  assert.equal(report.warnings.length, 0);
});

test("08/24 archive still matches the Fall 2026 PDF", () => {
  assert.equal(archive.semester, "Fall 2026");
  assert.equal(archive.reportDate, "2026-08-24");
  assert.equal(archive.capacity, 700);
  const filled = Object.values(archive.properties).reduce((sum, property) => sum + property.filled, 0);
  assert.equal(filled, 695);
  assert.equal(archive.properties["carriage-house"].filled, 231);
  assert.equal(archive.community["liberty-corner"], 17);
  assert.equal(archive.highlights.contractsSoldThisWeek, 8);
});
