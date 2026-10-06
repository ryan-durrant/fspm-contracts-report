import type { Metadata } from "next";
import { ReportDocument } from "@/components/report/ReportDocument";
import { formatRanOn } from "@/lib/format";
import { getConfig, getCurrentReport } from "@/lib/report";

export function generateMetadata(): Metadata {
  const report = getCurrentReport();
  return {
    title: `FSPM Contracts - ${report.semester}`,
    description: `Contracts report ran ${formatRanOn(report.reportDate)}.`,
  };
}

export default function HomePage() {
  const report = getCurrentReport();
  return <ReportDocument report={report} config={getConfig()} currentDate={report.reportDate} />;
}
