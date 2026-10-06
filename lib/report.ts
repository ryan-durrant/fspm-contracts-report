import teamsConfig from "@/config/teams.json";
import reportJson from "@/data/report.json";
import type { ReportData, TeamsConfig } from "./types";

export function getCurrentReport(): ReportData {
  return reportJson as ReportData;
}

export function getConfig(): TeamsConfig {
  return teamsConfig as TeamsConfig;
}
