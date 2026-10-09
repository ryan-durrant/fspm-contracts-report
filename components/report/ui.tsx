import type { ReactNode } from "react";

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function Logo({ className = "h-11 w-auto" }: { className?: string; priority?: boolean }) {
  return (
    <img
      src={`${assetBase}/fspm-logo.svg`}
      alt="FSPM"
      width={261}
      height={155}
      className={className}
    />
  );
}

export function PageFrame({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="sheet mx-auto mb-6 w-full max-w-[920px] bg-sheet shadow-md print:mb-0 print:shadow-none">
      <header className="flex items-center justify-between gap-4 bg-brand px-4 py-3 text-white sm:px-5">
        <h2 className="text-[22px] font-semibold leading-none tracking-tight sm:text-[28px]">{title}</h2>
        <Logo className="h-9 w-auto sm:h-11" />
      </header>
      <div className="space-y-3 p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function Callout({ label, value, ring }: { label: ReactNode; value: ReactNode; ring?: ReactNode }) {
  return (
    <div className="border-2 border-black bg-white px-2 py-1.5 text-center">
      <div className="text-[11px] font-bold leading-tight sm:text-xs">{label}</div>
      <div className="mt-0.5 text-xl font-bold leading-none tabular-nums sm:text-[26px]">
        <Ringed ring={ring}>{value}</Ringed>
      </div>
    </div>
  );
}

export function Ringed({ children, ring }: { children: ReactNode; ring?: ReactNode }) {
  if (!ring) return <>{children}</>;
  return (
    <span className="relative inline-block">
      {children}
      {ring}
    </span>
  );
}

export function ChartPanel({
  chart,
  callouts,
}: {
  chart: ReactNode;
  callouts: { key: string; label: ReactNode; value: ReactNode; position: string; ring?: ReactNode }[];
}) {
  return (
    <div className="border border-neutral-500 bg-white p-2 sm:p-3">
      <div className="mb-3 grid grid-cols-2 gap-2 md:hidden">
        {callouts.map((item) => (
          <Callout key={item.key} label={item.label} value={item.value} ring={item.ring} />
        ))}
      </div>
      <div className="relative">
        {chart}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {callouts.map((item) => (
            <div key={item.key} className={`absolute w-36 ${item.position}`}>
              <Callout label={item.label} value={item.value} ring={item.ring} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PipelineLegend() {
  return (
    <aside className="flex max-w-xs flex-col justify-center bg-white px-3 py-3 text-[13px] font-semibold leading-snug md:col-span-2">
      <p className="text-unapproved">Green number refers to people taking beds who haven&apos;t signed.</p>
      <p className="mt-3 text-inactive">Blue number refers to inactive leads for the property.</p>
    </aside>
  );
}
