#!/usr/bin/env node
/**
 * Build data/report.json from a Monday export of the Rexburg Real Estate Database.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function parseCsv(text){return [];}
export function parseUsDate(value){return null;}
export function monthLabel(){return "";}
export function buildAliasIndex(){return new Map();}
export function normalizeName(value){return String(value??"");}
export function monthToDateDelta(){return 0;}
export function monthlySeries(){return [];}
export function boiseDate(){return "2026-10-19";}
export function genderOccupancy(){return {women:null,men:null,warnings:[]};}
export function buildReport(){throw new Error("stub");}
export function fetchTrackerFromSheets(){throw new Error("stubbed");}
export function main(){return null;}
