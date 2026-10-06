import fs from "node:fs";
import path from "node:path";
import type { ReportData } from "./types";

const archiveDir = path.join(process.cwd(), "data/archive");

export function listArchiveDates(): string[] {
  if (!fs.existsSync(archiveDir)) return [];
  return fs
    .readdirSync(archiveDir)
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .map((file) => file.slice(0, 10))
    .sort()
    .reverse();
}

export function readArchive(date: string): ReportData | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const file = path.join(archiveDir, `${date}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as ReportData;
}
