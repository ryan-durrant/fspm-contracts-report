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
