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
