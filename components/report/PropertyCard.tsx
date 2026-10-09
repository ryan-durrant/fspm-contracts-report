import type { ReactNode } from "react";
import { percentText, yoyText } from "@/lib/format";
import { Ringed } from "./ui";

export function PropertyCard({
  name,
  color,
  filled,
  capacity,
  unapproved,
  inactive,
  lastYear,
  variant,
  rings,
}: {
  name: string;
  color: string;
  filled: number;
  capacity: number;
  unapproved?: number;
  inactive?: number;
  lastYear?: number | null;
  variant: "current" | "compare" | "simple";
  rings?: Partial<Record<"filled" | "percent" | "unapproved" | "inactive", ReactNode>>;
}) {
  return (
    <article className="min-w-0 border border-neutral-300 bg-white">
      <h3 className="px-2 py-1 text-center text-[13px] font-semibold text-white" style={{ backgroundColor: color }}>
        {name}
      </h3>
      <div className="px-2 py-2 text-center">
        {variant === "compare" ? (
          <>
            <p className="text-[13px] leading-snug text-black">
              This year: {filled} / Last year: {lastYear ?? "—"}
            </p>
            <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">
              <Ringed ring={rings?.percent}>{yoyText(filled, lastYear)}</Ringed>
            </p>
          </>
        ) : (
          <>
            <p className="text-[26px] font-semibold leading-none tabular-nums sm:text-[28px]">
              <Ringed ring={rings?.filled}>
                {filled}/{capacity}
              </Ringed>
            </p>
            {variant === "current" ? (
              <div className="mt-1 grid grid-cols-3 items-center">
                <span className="text-lg font-semibold tabular-nums text-unapproved">
                  <Ringed ring={rings?.unapproved}>{unapproved ?? 0}</Ringed>
                </span>
                <span className="text-[26px] font-bold leading-none tabular-nums">
                  <Ringed ring={rings?.percent}>{percentText(filled, capacity)}</Ringed>
                </span>
                <span className="text-lg font-semibold tabular-nums text-inactive">
                  <Ringed ring={rings?.inactive}>{inactive ?? 0}</Ringed>
                </span>
              </div>
            ) : (
              <p className="mt-1 text-[26px] font-bold leading-none tabular-nums">
                <Ringed ring={rings?.percent}>{percentText(filled, capacity)}</Ringed>
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
