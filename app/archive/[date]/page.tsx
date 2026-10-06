import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportDocument } from "@/components/report/ReportDocument";
import { listArchiveDates, readArchive } from "@/lib/archive";
import { formatRanOn } from "@/lib/format";
import { getConfig, getCurrentReport } from "@/lib/report";

export function generateStaticParams() {
  return listArchiveDates().map((date) => ({ date }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const report = readArchive(date);
  if (!report) return { title: "Report not found" };
  return {
    title: `FSPM Contracts - ${report.semester} (${formatRanOn(report.reportDate)})`,
    description: `Archived contracts report ran ${formatRanOn(report.reportDate)}.`,
  };
}

export default async function ArchiveReportPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const report = readArchive(date);
  if (!report) notFound();
  return (
    <ReportDocument
      report={report}
      config={getConfig()}
      archiveDate={date}
      currentDate={getCurrentReport().reportDate}
    />
  );
}
