import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, "data/report.json"), "utf8"));
const fall = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-08-24.json"), "utf8"));
const october5 = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-10-05.json"), "utf8"));

const approved = {
  "carriage-house": [234, 234, 0, 2],
  "carriage-townhouse": [8, 8, 0, 0],
  "avonlea-house": [14, 14, 0, 0],
  "avonlea-women": [66, 63, 1, 3],
  "haven-blue": [140, 118, 8, 14],
  "haven-179": [7, 5, 1, 1],
  "haven-175": [7, 7, 0, 2],
  "haven-163": [7, 6, 0, 0],
  "haven-149": [12, 12, 0, 1],
  "haven-white": [24, 23, 1, 3],
  "avonlea-men": [79, 73, 5, 6],
  "haven-129": [6, 4, 2, 2],
  "haven-green": [48, 47, 1, 2],
  "haven-red": [48, 43, 3, 6],
};

const spring = {
  "carriage-house": [234, 78],
  "carriage-townhouse": [8, 6],
  "avonlea-house": [14, 4],
  "avonlea-women": [66, 21],
  "haven-blue": [140, 38],
  "haven-179": [7, 3],
  "haven-175": [7, 5],
  "haven-163": [7, 0],
  "haven-149": [12, 1],
  "haven-white": [24, 9],
  "avonlea-men": [79, 21],
  "haven-129": [6, 1],
  "haven-green": [48, 12],
  "haven-red": [48, 6],
};

const lastYear = {
  "carriage-house": 232,
  "carriage-townhouse": 7,
  "avonlea-house": 14,
  "avonlea-women": 63,
  "haven-blue": 115,
  "haven-179": 6,
  "haven-175": 5,
  "haven-163": 6,
  "haven-149": 11,
  "haven-white": 19,
  "avonlea-men": 50,
  "haven-129": 4,
  "haven-green": 38,
  "haven-red": 18,
};

test("shipped report is the 10/12/2026 Winter week", () => {
  assert.equal(report.semester, "Winter 2027");
  assert.equal(report.reportDate, "2026-10-12");
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
    assert.equal(row.lastYear, lastYear[id], id);
    filled += approvedCount;
    unapproved += green;
    inactive += blue;
  }
  assert.equal(filled, 657);
  assert.equal(unapproved, 22);
  assert.equal(inactive, 42);
  assert.equal(Object.values(lastYear).reduce((sum, value) => sum + value, 0), 588);
  assert.equal(Math.round(report.callouts.bnh * 100), 94);
  assert.equal(report.callouts.bnh, 0.94);
  assert.equal(Math.round(report.callouts.women * 100), 96);
  assert.equal(Math.round(report.callouts.men * 100), 90);
  assert.equal(Math.round(report.callouts.market * 100), 65);
  assert.equal(report.highlights.contractsSoldThisWeek, 37);
  assert.equal(report.highlights.marketSold, 10563);
  assert.equal(report.highlights.marketCapacity, 16244);
  assert.equal(Math.round(report.highlights.market * 100), 65);
  assert.equal(Math.round(report.highlights.women * 100), 64);
  assert.equal(Math.round(report.highlights.men * 100), 66);
  assert.equal(Math.round(report.callouts.market * 100) === 59, false);
  const history = Object.fromEntries(report.monthlyContracts.map((point) => [point.label, point.value]));
  assert.equal(history["8/24"], 361);
  assert.equal(history["9/28"], 516);
  assert.equal(history["10/5"], 620);
  assert.equal(history["10/12"], 657);
  const prior = report.lastYear.monthlyContracts.filter((point) => point.value != null);
  assert.deepEqual(
    prior.map((point) => [point.label, point.value]),
    [
      ["9/22", 457],
      ["10/12", 588],
    ],
  );
  assert.equal(Math.round(report.lastYear.bnh * 100), 84);
  assert.equal(report.lastYear.market, 11089 / 16176);
  assert.equal(report.lastYear.marketSold, 11089);
  assert.equal(report.lastYear.marketCapacity, 16176);
  assert.equal(report.nextSemester.semester, "Spring 2027");
  assert.equal(report.nextSemester.capacity, 700);
  let nextFilled = 0;
  for (const [id, [capacity, count]] of Object.entries(spring)) {
    const row = report.nextSemester.properties[id];
    assert.equal(row.capacity, capacity, id);
    assert.equal(row.filled, count, id);
    nextFilled += count;
  }
  assert.equal(nextFilled, 205);
  assert.equal(report.nextSemester.callouts.market, null);
  assert.equal(report.nextSemester.callouts.decimals, 0);
  assert.equal(Math.round(report.nextSemester.callouts.bnh * 100), 29);
  assert.equal(report.goals["shalynn-kate"].week, 11);
  assert.equal(report.goals["kelsee-shaylee"].week, 15);
  assert.equal(report.goals["kenzie-lauren"].week, 11);
  assert.equal(report.goals["shalynn-kate"].month, 66);
  assert.equal(report.goals["kelsee-shaylee"].month, 24);
  assert.equal(report.goals["kenzie-lauren"].month, 51);
  assert.equal(report.highlights.houses.label, "Haven 149");
  assert.equal(report.highlights.houses.count, 6);
  assert.equal(report.highlights.apartments.label, "There was a tie");
  assert.equal(report.highlights.apartments.count, 11);
  assert.equal(report.communityHousing.asOf, "2026-10-12");
  assert.deepEqual(report.communityHousing.properties["liberty-corner"], { filled: 17, capacity: 18 });
  assert.deepEqual(report.communityHousing.properties["lc-ii"], { filled: 7, capacity: 8 });
  assert.deepEqual(report.communityHousing.properties["lc-house"], { filled: 3, capacity: 3 });
  assert.deepEqual(report.communityHousing.properties["lc-duplex"], { filled: 1, capacity: 2 });
  assert.deepEqual(report.communityHousing.properties["classic-122"], {
    filled: 1,
    capacity: 2,
    note: "Dec 1 Start",
  });
  assert.deepEqual(report.communityHousing.properties["rock-casa"], { filled: 3, capacity: 3 });
  assert.deepEqual(report.communityHousing.properties["haven-green-townhouse"], { filled: 0, capacity: 1 });
  assert.deepEqual(report.communityHousing.offices["avonlea-office"], {
    name: "Avonlea Office",
    filled: 28,
    capacity: 31,
  });
  assert.deepEqual(report.communityHousing.offices["haven-office"], {
    name: "Haven Office",
    filled: 15,
    capacity: 17,
  });
  assert.equal(
    report.tip.intro,
    "What a week. You added 37 contracts and pushed us to 657/700 (94%). You also cut the people holding beds without completed approval from 47 to 22, more than half gone in one week. Carriage House is 100% full. That's great work, and it shows.",
  );
  assert.equal(
    report.tip.closing,
    "We're close, so let's finish strong. Every team has the same focus this week: 43 beds are still open, 22 people are holding a bed without completed approval, and 42 leads are inactive. Haven Blue has the most to go, with 22 open beds, 8 unsigned and 14 inactive leads. Henry Ford said, \"Whether you think you can or you think you can't, you're right.\" I think we can. Work those lists, get every contract signed and get the payment in.",
  );
  assert.equal(report.tip.link, "");
  assert.equal(JSON.stringify(report).includes("notes"), false);
  assert.equal(report.warnings.length, 0);
});

test("10/5 archive stays the week that was published", () => {
  assert.equal(october5.reportDate, "2026-10-05");
  assert.equal(october5.capacity, 700);
  const filled = Object.values(october5.properties).reduce((sum, property) => sum + property.filled, 0);
  assert.equal(filled, 620);
  assert.equal(october5.properties["carriage-house"].filled, 223);
  assert.equal(october5.properties["carriage-house"].unapproved, 11);
  assert.equal(october5.nextSemester.capacity, 701);
  assert.equal(october5.nextSemester.properties["haven-149"].capacity, 13);
  assert.equal(october5.nextSemester.properties["haven-149"].filled, 1);
  assert.equal(october5.communityHousing.properties["rock-casa"].filled, 1);
  assert.equal(october5.communityHousing.properties["rock-casa"].capacity, 1);
  assert.equal(october5.communityHousing.offices["haven-office"].filled, 13);
  assert.equal(october5.callouts.women, null);
  assert.equal(Math.round(october5.callouts.market * 100), 59);
  assert.equal(october5.highlights.contractsSoldThisWeek, 104);
  assert.equal(october5.goals["shalynn-kate"].month, 55);
  assert.equal(october5.goals["kelsee-shaylee"].month, 9);
  assert.equal(october5.goals["kenzie-lauren"].month, 40);
});

test("08/24 archive still matches the Fall 2026 PDF", () => {
  assert.equal(fall.semester, "Fall 2026");
  assert.equal(fall.reportDate, "2026-08-24");
  assert.equal(fall.capacity, 700);
  const filled = Object.values(fall.properties).reduce((sum, property) => sum + property.filled, 0);
  assert.equal(filled, 695);
  assert.equal(fall.properties["carriage-house"].filled, 231);
  assert.equal(fall.community["liberty-corner"], 17);
  assert.equal(fall.highlights.contractsSoldThisWeek, 8);
  assert.equal(fall.goals["shalynn-kate"].month, 1);
  assert.equal(fall.goals["kelsee-shaylee"].month, 1);
  assert.equal(fall.goals["kenzie-lauren"].month, 6);
});
