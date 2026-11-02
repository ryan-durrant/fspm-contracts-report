import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildReport } from "../scripts/build-from-sheet.mjs";
import { buildCommunityDocument, parseCommunityBody } from "../scripts/parse-community-housing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const teams = JSON.parse(fs.readFileSync(path.join(root, "config/teams.json"), "utf8"));

function readFixture(name) {
  return fs.readFileSync(path.join(root, "tests/fixtures", name), "utf8");
}

test("newer email style maps aliases and drops notes", () => {
  const body = readFixture("community-housing-newer.txt");
  const { found, unrecognized } = parseCommunityBody(body, teams);
  assert.deepEqual(found.get("liberty-corner"), { filled: 17, capacity: 18 });
  assert.deepEqual(found.get("lc-ii"), { filled: 7, capacity: 8 });
  assert.deepEqual(found.get("lc-duplex"), { filled: 1, capacity: 2 });
  assert.deepEqual(found.get("lc-house"), { filled: 3, capacity: 3 });
  assert.deepEqual(found.get("bell-house"), { filled: 1, capacity: 1 });
  assert.deepEqual(found.get("classic-122"), { filled: 1, capacity: 2 });
  assert.deepEqual(found.get("haven-green-townhouse"), { filled: 0, capacity: 1 });
  assert.deepEqual(unrecognized, ["Cabin Out Back"]);
  const packed = JSON.stringify(Object.fromEntries(found));
  assert.equal(packed.includes("turning"), false);
  assert.equal(packed.includes("Hello"), false);
});

test("older email style maps LC 1, LC 2, and Red Brick House", () => {
  const { found, unrecognized } = parseCommunityBody(readFixture("community-housing-older.txt"), teams);
  assert.deepEqual(found.get("liberty-corner"), { filled: 17, capacity: 18 });
  assert.deepEqual(found.get("lc-ii"), { filled: 6, capacity: 8 });
  assert.deepEqual(found.get("lc-house"), { filled: 2, capacity: 3 });
  assert.deepEqual(found.get("lc-duplex"), { filled: 2, capacity: 2 });
  assert.deepEqual(found.get("t-house"), { filled: 0, capacity: 1 });
  assert.deepEqual(unrecognized, []);
  const packed = JSON.stringify(Object.fromEntries(found));
  assert.equal(packed.includes("painting"), false);
  assert.equal(packed.includes("flooring"), false);
  assert.equal(packed.includes("offline"), false);
});

test("office totals add the cards and a newer email replaces stored counts", () => {
  const first = buildCommunityDocument({
    teams,
    body: readFixture("community-housing-f26.txt"),
    asOf: "2026-08-24",
  });
  assert.equal(first.carriedForward, false);
  assert.equal(first.document.asOf, "2026-08-24");
  assert.deepEqual(first.document.offices["avonlea-office"], {
    name: "Avonlea Office",
    filled: 17 + 8 + 2 + 2,
    capacity: 18 + 8 + 3 + 2,
  });
  assert.deepEqual(first.document.offices["haven-office"], {
    name: "Haven Office",
    filled: 1 + 1 + 1 + 3 + 3 + 1 + 1 + 3 + 1 + 1,
    capacity: 1 + 1 + 1 + 3 + 3 + 2 + 1 + 3 + 1 + 1,
  });

  const sameDay = buildCommunityDocument({
    teams,
    body: readFixture("community-housing-newer.txt"),
    asOf: "2026-08-24",
    previous: first.document,
  });
  assert.equal(sameDay.carriedForward, true);
  assert.equal(sameDay.document.properties["lc-ii"].filled, 8);

  const newer = buildCommunityDocument({
    teams,
    body: "LCII - 4/8 Bell House - 0/1",
    asOf: "2026-10-02",
    previous: first.document,
  });
  assert.equal(newer.carriedForward, false);
  assert.equal(newer.document.asOf, "2026-10-02");
  assert.equal(newer.document.properties["lc-ii"].filled, 4);
  assert.equal(newer.document.properties["bell-house"].filled, 0);
  assert.equal(newer.document.properties["liberty-corner"].filled, 17);
  assert.ok(newer.kept.includes("Liberty Corner"));
  assert.equal(JSON.stringify(newer.document).includes("Cabin"), false);
});

test("lease start dates are stored without resident names and carry forward", () => {
  const body = [
    "LCD - 1/2 Upstairs has been leased for 12/7/26",
    "Haven Green Townhouse - 0/1 ZZZNAME moving in December 1st",
    "#122 Classic -1/2 Basement leased for 12/1/26",
    "North Triplex - 3/3 Basement unit moves out 11/30, released for 12/14/26",
    "LC - 17/18 #1 is vacant and listed",
  ].join("\n");
  const first = buildCommunityDocument({ teams, body, asOf: "2026-10-30" });
  assert.deepEqual(first.document.properties["lc-duplex"].leaseStarts, [
    { unit: "Upstairs", text: "start date of December 7" },
  ]);
  assert.deepEqual(first.document.properties["haven-green-townhouse"].leaseStarts, [
    { text: "start date of December 1" },
  ]);
  assert.deepEqual(first.document.properties["classic-122"].leaseStarts, [
    { unit: "Basement", text: "start date of December 1" },
  ]);
  assert.equal(first.document.properties["north-triplex"].leaseStarts, undefined);
  assert.equal(first.document.properties["liberty-corner"].leaseStarts, undefined);
  const packed = JSON.stringify(first.document);
  assert.equal(packed.includes("ZZZNAME"), false);
  assert.equal(packed.includes("vacant"), false);
  assert.equal(packed.includes("released"), false);
  assert.equal(packed.includes("notes"), false);

  const next = buildCommunityDocument({
    teams,
    body: "Haven Green Townhouse - 1/1",
    asOf: "2026-11-06",
    previous: first.document,
  });
  assert.equal(next.carriedForward, false);
  assert.equal(next.document.properties["haven-green-townhouse"].filled, 1);
  assert.deepEqual(next.document.properties["haven-green-townhouse"].leaseStarts, [
    { text: "start date of December 1" },
  ]);
  assert.deepEqual(next.document.properties["lc-duplex"].leaseStarts, [
    { unit: "Upstairs", text: "start date of December 7" },
  ]);
});

test("Rock Casa stays 3/3 even when the email lists 1/1", () => {
  const parsed = buildCommunityDocument({
    teams,
    body: "Rock Casa - 1/1",
    asOf: "2026-11-02",
  });
  assert.equal(parsed.document.properties["rock-casa"].filled, 3);
  assert.equal(parsed.document.properties["rock-casa"].capacity, 3);
  assert.equal(parsed.document.offices["haven-office"].filled, 1);
  assert.equal(parsed.document.offices["haven-office"].capacity, 15);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rock-casa-"));
  const communityFile = path.join(dir, "community-housing.json");
  fs.writeFileSync(
    communityFile,
    JSON.stringify({
      asOf: "2026-11-02",
      properties: { "rock-casa": { filled: 1, capacity: 1 } },
      offices: { "haven-office": { name: "Haven Office", filled: 13, capacity: 15 } },
    }),
  );
  const report = buildReport({
    teams,
    countsFile: path.join(root, "data/samples/counts-w27.json"),
    asOf: "2026-10-05",
    communityFile,
  });
  assert.deepEqual(report.communityHousing.properties["rock-casa"], { filled: 3, capacity: 3 });
  assert.equal(report.community["rock-casa"], 3);
  assert.deepEqual(report.communityHousing.offices["haven-office"], {
    name: "Haven Office",
    filled: 13,
    capacity: 15,
  });
});

test("no email keeps the stored as-of date", () => {
  const stored = buildCommunityDocument({
    teams,
    body: readFixture("community-housing-f26.txt"),
    asOf: "2026-08-24",
  }).document;
  const kept = buildCommunityDocument({
    teams,
    body: null,
    asOf: "2026-10-06",
    previous: stored,
  });
  assert.equal(kept.carriedForward, true);
  assert.equal(kept.document.asOf, "2026-08-24");
  assert.equal(kept.document.properties["rock-casa"].filled, 3);
});

test("build-from-sheet --community overrides editorial counts", () => {
  const editorial = JSON.parse(fs.readFileSync(path.join(root, "data/editorial/f26-2026-08-24.json"), "utf8"));
  const community = buildCommunityDocument({
    teams,
    body: "LC - 10/18",
    asOf: "2026-10-02",
  }).document;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "community-"));
  const communityFile = path.join(dir, "community-housing.json");
  fs.writeFileSync(communityFile, JSON.stringify(community));
  const report = buildReport({
    teams,
    countsFile: path.join(root, "data/samples/counts-w27.json"),
    asOf: "2026-10-05",
    editorial,
    communityFile,
  });
  assert.equal(report.community["liberty-corner"], 10);
  assert.equal(report.communityAsOf, "2026-10-02");
  assert.equal(report.communityHousing.offices["avonlea-office"].filled, 10);
  assert.equal(JSON.stringify(report).includes("Hello"), false);
});
