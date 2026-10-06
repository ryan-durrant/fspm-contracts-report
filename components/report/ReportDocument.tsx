import Link from "next/link";
import { contractAxisMax, formatNumber, formatRanOn, marketAxisMax, percentText, ratioText } from "@/lib/format";
import type { ReportData, TeamsConfig } from "@/lib/types";
import { navSections, propertiesInOrder, propertyMap, snapshot, teamTotals } from "@/lib/view";
import { LineChart } from "./LineChart";
import { PrintButton } from "./PrintButton";
import { PropertyCard } from "./PropertyCard";
import { Callout, ChartPanel, Logo, PageFrame, PipelineLegend } from "./ui";

const THIS_YEAR = "#0088E8";
const LAST_YEAR = "#E07820";

export function ReportDocument({
  report,
  config,
  archiveDate,
  currentDate,
}: {
  report: ReportData;
  config: TeamsConfig;
  archiveDate?: string;
  currentDate: string;
}) {
  const sections = navSections(config, Boolean(report.nextSemester), report.nextSemester?.semester ?? "Next");
  const showArchiveBanner = archiveDate != null && archiveDate !== currentDate;

  return (
    <div className="min-h-screen bg-desk text-black">
      <header className="no-print sticky top-0 z-30 border-b border-black/10 bg-brand text-white">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-4">
          <Link href="/" className="text-sm font-semibold tracking-tight sm:text-base">
            FSPM Contracts
          </Link>
          <p className="text-sm text-white/85">Ran {formatRanOn(report.reportDate)}</p>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1" aria-label="Report pages">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="shrink-0 rounded px-2 py-1 text-sm font-semibold text-white/90 hover:bg-white/15"
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/archive" className="text-sm font-semibold text-white/90 hover:underline">
              Archive
            </Link>
            <PrintButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] px-3 py-5 sm:px-4">
        {showArchiveBanner && (
          <p className="no-print mb-4 rounded border border-brand/30 bg-white px-3 py-2 text-sm">
            You are viewing the archived report from {formatRanOn(archiveDate)}.{" "}
            <Link href="/" className="font-semibold text-brand underline">
              Open the current week
            </Link>
            .
          </p>
        )}
        <CoverPage report={report} config={config} />
        <ContractsPage report={report} config={config} />
        <ComparisonPage report={report} config={config} />
        <HighlightsPage report={report} />
        <GoalsPage report={report} config={config} />
        {report.nextSemester && <NextSemesterPage report={report} config={config} />}
        <CommunityPage report={report} config={config} />
      </main>
    </div>
  );
}

function CoverPage({ report, config }: { report: ReportData; config: TeamsConfig }) {
  return (
    <section id="cover" className="sheet mx-auto mb-6 flex min-h-[680px] w-full max-w-[920px] flex-col overflow-hidden bg-white shadow-md md:min-h-[980px] md:flex-row print:mb-0 print:shadow-none">
      <aside className="flex flex-col bg-brand px-4 py-4 text-white md:w-[230px] md:px-4 md:py-5">
        <p className="text-xs leading-snug">
          {config.quote.text} – {config.quote.attribution}
        </p>
        <div className="flex flex-1 items-center justify-center py-8">
          <Logo priority className="h-16 w-auto md:h-[4.5rem]" />
        </div>
      </aside>
      <div className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
        <div>
          <h1 className="max-w-[18ch] border-b-[3px] border-brand pb-1 text-[32px] font-semibold leading-tight tracking-tight text-black sm:text-4xl">
            FSPM Contracts - {report.semester}
          </h1>
        </div>
        <div className="mt-12 max-w-xl text-[17px] leading-relaxed">
          <p className="text-xl font-bold">Tip of the Week:</p>
          <p className="mt-4">{config.tip.intro}</p>
          {config.tip.link && (
            <p className="mt-4">
              <a href={config.tip.link} className="break-all font-semibold text-brand underline">
                {config.tip.link}
              </a>
            </p>
          )}
          <p className="mt-4">{config.tip.closing}</p>
        </div>
        <p className="mt-auto pt-16 text-lg font-bold">Report Ran on {formatRanOn(report.reportDate)}</p>
      </div>
    </section>
  );
}

function ContractsPage({ report, config }: { report: ReportData; config: TeamsConfig }) {
  const byId = propertyMap(config);
  const values = report.monthlyContracts.map((point) => point.value);
  const callouts = [
    { key: "total", label: "Total Contracts:", value: formatNumber(report.callouts.totalContracts), position: "left-[2%] top-[2%]" },
    { key: "women", label: <>Women&apos;s<br />Occupancy:</>, value: ratioText(report.callouts.women, report.callouts.decimals), position: "left-[4%] top-[28%]" },
    { key: "men", label: <>Men&apos;s<br />Occupancy:</>, value: ratioText(report.callouts.men, report.callouts.decimals), position: "left-[4%] top-[58%]" },
    { key: "bnh", label: <>BNH<br />Occupancy:</>, value: ratioText(report.callouts.bnh, report.callouts.decimals), position: "left-[28%] top-[36%]" },
    { key: "market", label: <>Market<br />Occupancy:</>, value: ratioText(report.callouts.market, report.callouts.decimals), position: "left-[48%] top-[36%]" },
  ];

  return (
    <PageFrame id="contracts" title={`FSPM Contracts - ${report.semester}`}>
      <ChartPanel
        callouts={callouts}
        chart={
          <LineChart
            labels={report.monthlyContracts.map((point) => point.label)}
            series={[{ color: LAST_YEAR, values }]}
            yMax={contractAxisMax(values)}
            yStep={100}
            ariaLabel={`Total contracts by month for ${report.semester}. ${report.monthlyContracts
              .map((point) => `${point.label} ${point.value}`)
              .join(", ")}.`}
          />
        }
      />
      {config.teams.map((team, index) => {
        const totals = teamTotals(team.propertyIds, report.properties);
        return (
          <section key={team.id}>
            <h3 className="mb-2 text-[15px] font-bold">
              {team.name} - {percentText(totals.filled, totals.capacity)} Full
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {team.propertyIds.map((id) => {
                const property = byId.get(id);
                if (!property) return null;
                const snap = snapshot(report.properties, id, property.capacity);
                return (
                  <PropertyCard
                    key={id}
                    name={property.name}
                    color={team.headerColor}
                    filled={snap.filled}
                    capacity={snap.capacity}
                    unapproved={snap.unapproved}
                    inactive={snap.inactive}
                    variant="current"
                  />
                );
              })}
              {index === 0 && <PipelineLegend />}
            </div>
          </section>
        );
      })}
    </PageFrame>
  );
}

function ComparisonPage({ report, config }: { report: ReportData; config: TeamsConfig }) {
  const current = report.monthlyContracts.map((point) => point.value);
  const last = report.lastYear?.monthlyContracts.map((point) => point.value) ?? [];
  const labels = report.lastYear?.monthlyContracts.map((point) => point.label) ?? report.monthlyContracts.map((point) => point.label);
  const rows = propertiesInOrder(config);
  const callouts = [
    { key: "bnh", label: <>BNH<br />Occupancy:</>, value: ratioText(report.callouts.bnh, report.callouts.decimals), position: "left-[3%] top-[8%]" },
    { key: "market", label: <>Market<br />Occupancy:</>, value: ratioText(report.callouts.market, report.callouts.decimals), position: "left-[27%] top-[8%]" },
    { key: "ly-bnh", label: <>Last Year -<br />BNH:</>, value: ratioText(report.lastYear?.bnh, report.lastYear?.decimals ?? 0), position: "left-[3%] top-[42%]" },
    { key: "ly-market", label: <>Last Year<br />Market Occ.</>, value: ratioText(report.lastYear?.market, report.lastYear?.decimals ?? 0), position: "left-[27%] top-[42%]" },
  ];

  return (
    <PageFrame id="comparison" title="Last Year's Comparison">
      <ChartPanel
        callouts={callouts}
        chart={
          <LineChart
            labels={labels}
            series={[
              { name: "Last Year", color: LAST_YEAR, values: last },
              { name: "This Year", color: THIS_YEAR, values: current },
            ]}
            yMax={contractAxisMax([...current, ...last])}
            yStep={100}
            ariaLabel={`This year versus last year contracts. ${labels
              .map((label, index) => `${label}: last year ${last[index] ?? 0}, this year ${current[index] ?? 0}`)
              .join("; ")}.`}
          />
        }
      />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {rows.map(({ team, property }) => {
          const snap = snapshot(report.properties, property.id, property.capacity);
          return (
            <PropertyCard
              key={property.id}
              name={property.name}
              color={team.headerColor}
              filled={snap.filled}
              capacity={snap.capacity}
              lastYear={snap.lastYear}
              variant="compare"
            />
          );
        })}
      </div>
    </PageFrame>
  );
}

function HighlightsPage({ report }: { report: ReportData }) {
  const highlights = report.highlights;
  const values = highlights.monthlyMarketBeds.map((point) => point.value);
  const callouts = [
    { key: "beds", label: "Market Beds:", value: formatNumber(highlights.marketCapacity), position: "left-[2%] top-[4%]" },
    { key: "women", label: <>Women&apos;s<br />Occupancy:</>, value: ratioText(highlights.women, highlights.decimals), position: "left-[4%] top-[34%]" },
    { key: "men", label: <>Men&apos;s<br />Occupancy:</>, value: ratioText(highlights.men, highlights.decimals), position: "left-[4%] top-[62%]" },
    { key: "market", label: <>Market<br />Occupancy:</>, value: ratioText(highlights.market, highlights.decimals), position: "left-[28%] top-[40%]" },
  ];

  return (
    <PageFrame id="highlights" title="Week's Highlights">
      <div className="grid gap-2 md:grid-cols-3">
        <HighlightStat title="Total Contracts Sold" value={highlights.contractsSoldThisWeek} />
        <HighlightStat title="Most Contracts on the Week - Houses" detail={highlights.houses.label} value={highlights.houses.count} />
        <HighlightStat title="Most Contracts on the Week - Apts" detail={highlights.apartments.label} value={highlights.apartments.count} />
      </div>
      <ChartPanel
        callouts={callouts}
        chart={
          <>
            <p className="mb-1 text-center text-sm font-bold">BYU-Idaho Approved Housing Market</p>
            <LineChart
              labels={highlights.monthlyMarketBeds.map((point) => point.label)}
              series={[{ color: LAST_YEAR, values }]}
              yMax={marketAxisMax(values)}
              yStep={2000}
              ariaLabel={`BYU-Idaho approved housing market beds sold. ${highlights.monthlyMarketBeds
                .map((point) => `${point.label} ${formatNumber(point.value)}`)
                .join(", ")}. Market capacity ${formatNumber(highlights.marketCapacity)}.`}
            />
          </>
        }
      />
    </PageFrame>
  );
}

function HighlightStat({ title, detail, value }: { title: string; detail?: string; value: number }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center border-2 border-black bg-white px-3 py-3 text-center">
      <p className="text-[13px] font-bold leading-tight">{title}</p>
      {detail ? <p className="mt-2 text-sm font-semibold">{detail}</p> : null}
      <p className="mt-1 text-4xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function GoalsPage({ report, config }: { report: ReportData; config: TeamsConfig }) {
  return (
    <PageFrame id="goals" title="Individual and Team Goals">
      <div className="mx-auto max-w-3xl space-y-3 px-2 py-2 text-center text-[15px] leading-relaxed sm:text-base">
        {config.goalsCopy.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[36rem] border-collapse text-center">
          <thead>
            <tr className="bg-brand text-white">
              <th className="px-3 py-2 text-left text-sm font-semibold">Properties</th>
              <th className="px-3 py-2 text-sm font-semibold">Week&apos;s Actuals</th>
              <th className="px-3 py-2 text-sm font-semibold">Month&apos;s Actuals</th>
              <th className="px-3 py-2 text-sm font-semibold">Occupancy Actual</th>
            </tr>
          </thead>
          <tbody>
            {config.teams.map((team) => {
              const totals = teamTotals(team.propertyIds, report.properties);
              const goals = report.goals[team.id] ?? { week: 0, month: 0 };
              return (
                <tr key={team.id} style={{ backgroundColor: `color-mix(in srgb, ${team.headerColor} 28%, white)` }}>
                  <th className="px-3 py-4 text-left text-sm font-bold">{team.name}</th>
                  <td className="px-3 py-4 text-2xl font-bold tabular-nums">{goals.week}</td>
                  <td className="px-3 py-4 text-2xl font-bold tabular-nums">{goals.month}</td>
                  <td className="px-3 py-4 text-2xl font-bold tabular-nums">{percentText(totals.filled, totals.capacity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1.5fr)_12rem]">
        <div className="border-2 border-black bg-white p-4 text-[15px] leading-snug">
          {config.goalsCopy.bonus.map((paragraph) => (
            <p key={paragraph} className="mt-3 first:mt-0">
              {paragraph}
            </p>
          ))}
        </div>
        <Callout label={<>Current BNH<br />Occupancy</>} value={ratioText(report.callouts.bnh, 0)} />
      </div>
    </PageFrame>
  );
}

function NextSemesterPage({ report, config }: { report: ReportData; config: TeamsConfig }) {
  const next = report.nextSemester;
  if (!next) return null;
  const byId = propertyMap(config);
  const values = next.monthlyContracts.map((point) => point.value);
  const callouts = [
    { key: "total", label: "Total Contracts:", value: formatNumber(next.callouts.totalContracts), position: "left-[2%] top-[4%]" },
    { key: "bnh", label: <>BNH<br />Occupancy:</>, value: ratioText(next.callouts.bnh, next.callouts.decimals), position: "left-[8%] top-[34%]" },
    { key: "market", label: <>Market<br />Occupancy:</>, value: ratioText(next.callouts.market, next.callouts.decimals), position: "left-[32%] top-[28%]" },
  ];
  const snaps = Object.fromEntries(
    config.properties.map((property) => {
      const row = next.properties[property.id];
      return [property.id, { filled: row?.filled ?? 0, capacity: row?.capacity ?? property.capacity }];
    }),
  );

  return (
    <PageFrame id="next" title={`BNH Contracts - ${next.semester}`}>
      <ChartPanel
        callouts={callouts}
        chart={
          <LineChart
            labels={next.monthlyContracts.map((point) => point.label)}
            series={[{ color: LAST_YEAR, values }]}
            yMax={contractAxisMax(values)}
            yStep={100}
            ariaLabel={`${next.semester} contracts by month. ${next.monthlyContracts
              .map((point) => `${point.label} ${point.value}`)
              .join(", ")}.`}
          />
        }
      />
      {config.teams.map((team) => {
        const totals = teamTotals(team.propertyIds, snaps);
        return (
          <section key={team.id}>
            <h3 className="mb-2 text-[15px] font-bold">
              {team.name} - {percentText(totals.filled, totals.capacity)} Full
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {team.propertyIds.map((id) => {
                const property = byId.get(id);
                const row = snaps[id];
                if (!property || !row) return null;
                return (
                  <PropertyCard
                    key={id}
                    name={property.name}
                    color={team.headerColor}
                    filled={row.filled}
                    capacity={row.capacity}
                    variant="simple"
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </PageFrame>
  );
}

function CommunityPage({ report, config }: { report: ReportData; config: TeamsConfig }) {
  const submitted = Object.keys(report.community).length > 0;
  return (
    <PageFrame id="community" title="Community Housing - #'s as of today">
      {!submitted && (
        <p className="bg-white px-3 py-3 text-sm">Community housing numbers have not been entered for this week.</p>
      )}
      {config.offices.map((office) => (
        <section key={office.id}>
          <h3 className="mb-2 text-[15px] font-bold">{office.name}</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {office.properties.map((property) => (
              <PropertyCard
                key={property.id}
                name={property.name}
                color={office.headerColor}
                filled={report.community[property.id] ?? 0}
                capacity={property.capacity}
                variant="simple"
              />
            ))}
          </div>
        </section>
      ))}
      <div className="mx-auto max-w-md border-2 border-black bg-white px-4 py-4 text-center text-[15px] leading-snug">
        {config.communityNote}
      </div>
    </PageFrame>
  );
}
