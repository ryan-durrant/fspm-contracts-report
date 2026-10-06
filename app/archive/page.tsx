import Link from "next/link";
import { listArchiveDates } from "@/lib/archive";
import { formatRanOn } from "@/lib/format";
import { getCurrentReport } from "@/lib/report";

export const metadata = {
  title: "Report archive",
  description: "Earlier weekly FSPM contracts reports.",
};

export default function ArchiveIndexPage() {
  const dates = listArchiveDates();
  const current = getCurrentReport().reportDate;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-10">
      <p className="text-sm font-semibold text-brand">
        <Link href="/" className="underline">
          Current report
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Report archive</h1>
      <p className="mt-2 text-neutral-700">Each Monday rebuild adds a dated snapshot. The email link stays on / and /latest.</p>
      {dates.length === 0 ? (
        <p className="mt-8 border border-neutral-300 bg-white px-4 py-4">No archived reports yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-300 border border-neutral-300 bg-white">
          {dates.map((date) => (
            <li key={date}>
              <Link href={`/archive/${date}`} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50">
                <span className="font-semibold">{formatRanOn(date)}</span>
                <span className="text-sm text-neutral-600">{date === current ? "Current week" : "Snapshot"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
