import type { Metadata } from "next";
import { ReportDocument } from "@/components/report/ReportDocument";
import { formatRanOn } from "@/lib/format";
import { getConfig, getCurrentReport } from "@/lib/report";

export function generateMetadata(): Metadata {
  const report = getCurrentReport();
  return {
    title: `FSPM Contracts - ${report.semester}`,
    description: `Latest contracts report, ran ${formatRanOn(report.reportDate)}.`,
  };
}

export default function LatestPage() {
  const report = getCurrentReport();
  return <ReportDocument report={report} config={getConfig()} currentDate={report.reportDate} />;
}
