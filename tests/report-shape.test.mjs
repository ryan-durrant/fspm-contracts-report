import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, "data/report.json"), "utf8"));
const fall = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-08-24.json"), "utf8"));
const october5 = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-10-05.json"), "utf8"));
const october12 = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-10-12.json"), "utf8"));

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

test("10/12 archive stays the week that was published", () => {
  assert.equal(october12.semester, "Winter 2027");
  assert.equal(october12.reportDate, "2026-10-12");
  assert.equal(october12.capacity, 700);
  let filled = 0;
  let unapproved = 0;
  let inactive = 0;
  for (const [id, [capacity, approvedCount, green, blue]] of Object.entries(approved)) {
    const row = october12.properties[id];
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
  assert.equal(Math.round(october12.callouts.bnh * 100), 94);
  assert.equal(october12.callouts.bnh, 0.94);
  assert.equal(Math.round(october12.callouts.women * 100), 96);
  assert.equal(Math.round(october12.callouts.men * 100), 90);
  assert.equal(Math.round(october12.callouts.market * 100), 65);
  assert.equal(october12.highlights.contractsSoldThisWeek, 37);
  assert.equal(october12.highlights.marketSold, 10563);
  assert.equal(october12.highlights.marketCapacity, 16244);
  assert.equal(Math.round(october12.highlights.market * 100), 65);
  assert.equal(Math.round(october12.highlights.women * 100), 64);
  assert.equal(Math.round(october12.highlights.men * 100), 66);
  assert.equal(Math.round(october12.callouts.market * 100) === 59, false);
  const history = Object.fromEntries(october12.monthlyContracts.map((point) => [point.label, point.value]));
  assert.equal(history["8/24"], 361);
  assert.equal(history["9/28"], 516);
  assert.equal(history["10/5"], 620);
  assert.equal(history["10/12"], 657);
  const prior = october12.lastYear.monthlyContracts.filter((point) => point.value != null);
  assert.deepEqual(
    prior.map((point) => [point.label, point.value]),
    [
      ["9/22", 457],
      ["10/12", 588],
    ],
  );
  assert.equal(Math.round(october12.lastYear.bnh * 100), 84);
  assert.equal(october12.lastYear.market, 11089 / 16176);
  assert.equal(october12.lastYear.marketSold, 11089);
  assert.equal(october12.lastYear.marketCapacity, 16176);
  assert.equal(october12.nextSemester.semester, "Spring 2027");
  assert.equal(october12.nextSemester.capacity, 700);
  let nextFilled = 0;
  for (const [id, [capacity, count]] of Object.entries(spring)) {
    const row = october12.nextSemester.properties[id];
    assert.equal(row.capacity, capacity, id);
    assert.equal(row.filled, count, id);
    nextFilled += count;
  }
  assert.equal(nextFilled, 205);
  assert.equal(october12.nextSemester.callouts.market, null);
  assert.equal(october12.nextSemester.callouts.decimals, 0);
  assert.equal(Math.round(october12.nextSemester.callouts.bnh * 100), 29);
  assert.equal(october12.goals["shalynn-kate"].week, 11);
  assert.equal(october12.goals["kelsee-shaylee"].week, 15);
  assert.equal(october12.goals["kenzie-lauren"].week, 11);
  assert.equal(october12.goals["shalynn-kate"].month, 66);
  assert.equal(october12.goals["kelsee-shaylee"].month, 24);
  assert.equal(october12.goals["kenzie-lauren"].month, 51);
  assert.equal(october12.highlights.houses.label, "Haven 149");
  assert.equal(october12.highlights.houses.count, 6);
  assert.equal(october12.highlights.apartments.label, "There was a tie");
  assert.equal(october12.highlights.apartments.count, 11);
  assert.equal(october12.communityHousing.asOf, "2026-10-12");
  assert.deepEqual(october12.communityHousing.properties["liberty-corner"], { filled: 17, capacity: 18 });
  assert.deepEqual(october12.communityHousing.properties["lc-ii"], { filled: 7, capacity: 8 });
  assert.deepEqual(october12.communityHousing.properties["lc-house"], { filled: 3, capacity: 3 });
  assert.deepEqual(october12.communityHousing.properties["lc-duplex"], { filled: 1, capacity: 2 });
  assert.deepEqual(october12.communityHousing.properties["classic-122"], {
    filled: 1,
    capacity: 2,
    note: "Dec 1 Start",
  });
  assert.deepEqual(october12.communityHousing.properties["rock-casa"], { filled: 3, capacity: 3 });
  assert.deepEqual(october12.communityHousing.properties["haven-green-townhouse"], { filled: 0, capacity: 1 });
  assert.deepEqual(october12.communityHousing.offices["avonlea-office"], {
    name: "Avonlea Office",
    filled: 28,
    capacity: 31,
  });
  assert.deepEqual(october12.communityHousing.offices["haven-office"], {
    name: "Haven Office",
    filled: 15,
    capacity: 17,
  });
  assert.equal(
    october12.tip.intro,
    "What a week. You added 37 contracts and pushed us to 657/700 (94%). You also cut the people holding beds without completed approval from 47 to 22, more than half gone in one week. Carriage House is 100% full. That's great work, and it shows.",
  );
  assert.equal(
    october12.tip.closing,
    "We're close, so let's finish strong. Every team has the same focus this week: 43 beds are still open, 22 people are holding a bed without completed approval, and 42 leads are inactive. Haven Blue has the most to go, with 22 open beds, 8 unsigned and 14 inactive leads. Henry Ford said, \"Whether you think you can or you think you can't, you're right.\" I think we can. Work those lists, get every contract signed and get the payment in.",
  );
  assert.equal(october12.tip.link, "");
  assert.equal(JSON.stringify(october12).includes("notes"), false);
  assert.equal(october12.warnings.length, 0);
});

const approved1019 = {
  "carriage-house": [234, 234, 0, 6, 232],
  "carriage-townhouse": [8, 8, 0, 0, 7],
  "avonlea-house": [14, 14, 0, 0, 14],
  "avonlea-women": [66, 65, 0, 7, 66],
  "haven-blue": [140, 122, 8, 9, 119],
  "haven-179": [7, 5, 1, 1, 6],
  "haven-175": [7, 7, 0, 1, 6],
  "haven-163": [7, 6, 1, 2, 6],
  "haven-149": [12, 12, 0, 1, 11],
  "haven-white": [24, 24, 0, 3, 23],
  "avonlea-men": [79, 75, 4, 8, 68],
  "haven-129": [6, 4, 2, 4, 6],
  "haven-green": [48, 47, 1, 4, 43],
  "haven-red": [48, 42, 6, 9, 24],
};

const spring1019 = {
  "carriage-house": [234, 78],
  "carriage-townhouse": [8, 7],
  "avonlea-house": [14, 4],
  "avonlea-women": [66, 21],
  "haven-blue": [140, 39],
  "haven-179": [7, 3],
  "haven-175": [7, 5],
  "haven-163": [7, 0],
  "haven-149": [12, 1],
  "haven-white": [24, 9],
  "avonlea-men": [79, 23],
  "haven-129": [6, 1],
  "haven-green": [48, 13],
  "haven-red": [48, 6],
};

test("10/19 archive stays the week that was published", () => {
  const report = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-10-19.json"), "utf8"));
  assert.equal(report.semester, "Winter 2027");
  assert.equal(report.reportDate, "2026-10-19");
  assert.equal(report.capacity, 700);
  let filled = 0;
  let unapproved = 0;
  let inactive = 0;
  let priorFilled = 0;
  for (const [id, [capacity, approvedCount, green, blue, priorCount]] of Object.entries(approved1019)) {
    const row = report.properties[id];
    assert.equal(row.capacity, capacity, id);
    assert.equal(row.filled, approvedCount, id);
    assert.equal(row.unapproved, green, id);
    assert.equal(row.inactive, blue, id);
    assert.equal(row.lastYear, priorCount, id);
    filled += approvedCount;
    unapproved += green;
    inactive += blue;
    priorFilled += priorCount;
  }
  assert.equal(filled, 665);
  assert.equal(unapproved, 23);
  assert.equal(inactive, 55);
  assert.equal(priorFilled, 631);
  assert.equal(report.callouts.bnh, 665 / 700);
  assert.equal(report.callouts.women, 0.96);
  assert.equal(report.callouts.men, 0.9);
  assert.equal(report.callouts.decimals, 0);
  assert.equal(report.callouts.market, 11607 / 16244);
  assert.equal(report.highlights.contractsSoldThisWeek, 8);
  assert.equal(report.highlights.marketSold, 11607);
  assert.equal(report.highlights.marketCapacity, 16244);
  assert.equal(report.highlights.women, 5813 / 8333);
  assert.equal(report.highlights.men, 5794 / 7911);
  assert.equal(report.highlights.houses.label, "There was a tie");
  assert.equal(report.highlights.houses.count, 0);
  assert.equal(report.highlights.apartments.label, "Haven Blue");
  assert.equal(report.highlights.apartments.count, 4);
  const history = Object.fromEntries(report.monthlyContracts.map((point) => [point.label, point.value]));
  assert.equal(history["10/12"], 657);
  assert.equal(history["10/19"], 665);
  const prior = report.lastYear.monthlyContracts.filter((point) => point.value != null);
  assert.deepEqual(prior.at(-1), { label: "10/19", value: 631 });
  assert.deepEqual(prior.at(-2), { label: "10/12", value: 588 });
  assert.equal(report.lastYear.bnh, 631 / 700);
  assert.equal(report.lastYear.marketSold, 12134);
  assert.equal(report.lastYear.marketCapacity, 16176);
  assert.equal(report.lastYear.market, 12134 / 16176);
  assert.equal(report.nextSemester.semester, "Spring 2027");
  assert.equal(report.nextSemester.reportDate, "2026-10-19");
  let nextFilled = 0;
  for (const [id, [capacity, count]] of Object.entries(spring1019)) {
    const row = report.nextSemester.properties[id];
    assert.equal(row.capacity, capacity, id);
    assert.equal(row.filled, count, id);
    nextFilled += count;
  }
  assert.equal(nextFilled, 210);
  assert.equal(report.nextSemester.callouts.market, 1368 / 16244);
  assert.equal(report.nextSemester.callouts.decimals, 0);
  assert.equal(report.nextSemester.callouts.bnh, 210 / 700);
  assert.equal(report.goals["shalynn-kate"].week, 0);
  assert.equal(report.goals["kelsee-shaylee"].week, 4);
  assert.equal(report.goals["kenzie-lauren"].week, 4);
  assert.equal(report.goals["shalynn-kate"].month, 66);
  assert.equal(report.goals["kelsee-shaylee"].month, 28);
  assert.equal(report.goals["kenzie-lauren"].month, 55);
  assert.equal(report.communityHousing.asOf, "2026-10-16");
  assert.deepEqual(report.communityHousing.properties["liberty-corner"], { filled: 17, capacity: 18 });
  assert.deepEqual(report.communityHousing.properties["lc-ii"], { filled: 7, capacity: 8 });
  assert.deepEqual(report.communityHousing.properties["lc-duplex"], { filled: 1, capacity: 2 });
  assert.deepEqual(report.communityHousing.properties["lc-house"], { filled: 3, capacity: 3 });
  assert.deepEqual(report.communityHousing.properties["classic-122"], {
    filled: 1,
    capacity: 2,
    note: "Dec 1 Start",
  });
  assert.deepEqual(report.communityHousing.properties["haven-green-townhouse"], {
    filled: 0,
    capacity: 1,
    note: "Dec 1 Start",
  });
  assert.deepEqual(report.communityHousing.properties["rock-casa"], { filled: 3, capacity: 3 });
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
    "We're at 665 of 700 (95%), with just 35 beds left to fill. Great work, team. 23 people are holding a bed and haven't signed yet: Haven Blue has 8, Haven Red 6 and Avonlea Men 4. They've already picked their spot, so walk each one through signing and paying this week. Inactive leads also climbed from 42 to 55. Haven Blue and Haven Red have 9 each, and Avonlea Men has 8. Reach out to every one of them. A quick \"still interested?\" brings a lot of them back.",
  );
  assert.equal(
    report.tip.closing,
    "We're also in a slower stretch of the semester, so let's use it to get our properties in tip-top shape. Walk your property the way a parent would, like we practiced at the manager meeting training. Check the parking lot, the entry, the hallways and any open units, and fix anything you wouldn't want a parent to see. A great-looking property helps close every one of these leads.",
  );
  assert.equal(report.tip.link, "");
  assert.equal(JSON.stringify(report).includes("notes"), false);
  assert.equal(report.warnings.length, 0);
});

const approved1026 = {
  "carriage-house": [234, 233, 0, 8, 233],
  "carriage-townhouse": [8, 8, 0, 1, 8],
  "avonlea-house": [14, 14, 0, 0, 14],
  "avonlea-women": [66, 65, 1, 2, 66],
  "haven-blue": [140, 131, 6, 12, 128],
  "haven-179": [7, 5, 1, 1, 7],
  "haven-175": [7, 7, 0, 0, 6],
  "haven-163": [7, 6, 1, 0, 6],
  "haven-149": [12, 12, 0, 0, 11],
  "haven-white": [24, 24, 0, 1, 23],
  "avonlea-men": [79, 78, 1, 6, 74],
  "haven-129": [6, 4, 2, 2, 6],
  "haven-green": [48, 48, 0, 0, 42],
  "haven-red": [48, 44, 4, 9, 36],
};

const spring1026 = {
  "carriage-house": [234, 91],
  "carriage-townhouse": [8, 7],
  "avonlea-house": [14, 4],
  "avonlea-women": [66, 23],
  "haven-blue": [140, 46],
  "haven-179": [7, 3],
  "haven-175": [7, 5],
  "haven-163": [7, 1],
  "haven-149": [12, 1],
  "haven-white": [24, 9],
  "avonlea-men": [79, 27],
  "haven-129": [6, 1],
  "haven-green": [48, 16],
  "haven-red": [48, 6],
};

test("shipped report is the 10/26/2026 Winter week", () => {
  assert.equal(report.semester, "Winter 2027");
  assert.equal(report.reportDate, "2026-10-26");
  assert.equal(report.capacity, 700);
  let filled = 0;
  let unapproved = 0;
  let inactive = 0;
  let priorFilled = 0;
  for (const [id, [capacity, approvedCount, green, blue, priorCount]] of Object.entries(approved1026)) {
    const row = report.properties[id];
    assert.equal(row.capacity, capacity, id);
    assert.equal(row.filled, approvedCount, id);
    assert.equal(row.unapproved, green, id);
    assert.equal(row.inactive, blue, id);
    assert.equal(row.lastYear, priorCount, id);
    filled += approvedCount;
    unapproved += green;
    inactive += blue;
    priorFilled += priorCount;
  }
  assert.equal(filled, 679);
  assert.equal(unapproved, 16);
  assert.equal(inactive, 42);
  assert.equal(priorFilled, 660);
  assert.equal(report.callouts.bnh, 679 / 700);
  assert.equal(report.callouts.decimals, 0);
  assert.equal((report.callouts.women * 100).toFixed(0), "97");
  assert.equal((report.callouts.men * 100).toFixed(0), "96");
  assert.equal(report.callouts.market, 12849 / 16244);
  assert.equal(report.highlights.contractsSoldThisWeek, 14);
  assert.equal(report.highlights.marketSold, 12849);
  assert.equal(report.highlights.marketCapacity, 16244);
  assert.equal(report.highlights.women, 6391 / 8333);
  assert.equal(report.highlights.men, 6458 / 7911);
  assert.equal(report.highlights.houses.label, "There was a tie");
  assert.equal(report.highlights.houses.count, 0);
  assert.equal(report.highlights.apartments.label, "Haven Blue");
  assert.equal(report.highlights.apartments.count, 9);
  const history = Object.fromEntries(report.monthlyContracts.map((point) => [point.label, point.value]));
  assert.equal(history["10/19"], 665);
  assert.equal(history["10/26"], 679);
  const prior = report.lastYear.monthlyContracts.filter((point) => point.value != null);
  assert.deepEqual(prior.at(-1), { label: "10/26", value: 660 });
  assert.deepEqual(prior.at(-2), { label: "10/19", value: 631 });
  assert.equal(report.lastYear.bnh, 660 / 700);
  assert.equal(report.lastYear.marketSold, 13290);
  assert.equal(report.lastYear.marketCapacity, 16176);
  assert.equal(report.lastYear.market, 13290 / 16176);
  assert.equal(report.nextSemester.semester, "Spring 2027");
  assert.equal(report.nextSemester.reportDate, "2026-10-26");
  let nextFilled = 0;
  for (const [id, [capacity, count]] of Object.entries(spring1026)) {
    const row = report.nextSemester.properties[id];
    assert.equal(row.capacity, capacity, id);
    assert.equal(row.filled, count, id);
    nextFilled += count;
  }
  assert.equal(nextFilled, 240);
  assert.equal(report.nextSemester.callouts.market, 1592 / 16244);
  assert.equal(report.nextSemester.callouts.decimals, 0);
  assert.equal(report.nextSemester.callouts.bnh, 240 / 700);
  assert.equal(report.goals["shalynn-kate"].week, -1);
  assert.equal(report.goals["kelsee-shaylee"].week, 3);
  assert.equal(report.goals["kenzie-lauren"].week, 12);
  assert.equal(report.goals["shalynn-kate"].month, 65);
  assert.equal(report.goals["kelsee-shaylee"].month, 31);
  assert.equal(report.goals["kenzie-lauren"].month, 67);
  assert.equal(report.communityHousing.asOf, "2026-10-16");
  assert.deepEqual(report.communityHousing.properties["rock-casa"], { filled: 3, capacity: 3 });
  assert.deepEqual(report.communityHousing.offices["haven-office"], {
    name: "Haven Office",
    filled: 15,
    capacity: 17,
  });
  assert.deepEqual(report.tip.paragraphs, [
    "Great job on sales, team. We really appreciate the effort you're putting in. We're at 679 of 700 (97%) for Winter and close to full, so let's start shifting our focus to Spring 2027.",
    "\"Attitude is a little thing that makes a big difference.\" – Winston Churchill. Let's make every resident feel like the most important person we'll see today. Greet them with a smile when they walk in, and let them hear it in your voice when they call. We're always happy to see them.",
    "Also, remember Trista's social media training and let's build up our online presence, especially Google reviews. They matter most because they also show up on BYU-Idaho's TIS page. I just updated our photos on TIS and our company website with shots taken over the 7-week break, so everything looks a lot fresher. When a resident is happy, ask them for a review.",
  ]);
  assert.equal(report.tip.intro, undefined);
  assert.equal(JSON.stringify(report).includes("notes"), false);
  assert.equal(report.warnings.length, 0);
  const archive = JSON.parse(fs.readFileSync(path.join(root, "data/archive/2026-10-26.json"), "utf8"));
  assert.equal(JSON.stringify(archive), JSON.stringify(report));
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
