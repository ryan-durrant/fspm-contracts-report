import { percentText, yoyText } from "@/lib/format";

export function PropertyCard({
  name,
  color,
  filled,
  capacity,
  unapproved,
  inactive,
  lastYear,
  variant,
}: {
  name: string;
  color: string;
  filled: number;
  capacity: number;
  unapproved?: number;
  inactive?: number;
  lastYear?: number | null;
  variant: "current" | "compare" | "simple";
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
            <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">{yoyText(filled, lastYear)}</p>
          </>
        ) : (
          <>
            <p className="text-[26px] font-semibold leading-none tabular-nums sm:text-[28px]">
              {filled}/{capacity}
            </p>
            {variant === "current" ? (
              <div className="mt-1 grid grid-cols-3 items-center">
                <span className="text-lg font-semibold tabular-nums text-unapproved">{unapproved ?? 0}</span>
                <span className="text-[26px] font-bold leading-none tabular-nums">{percentText(filled, capacity)}</span>
                <span className="text-lg font-semibold tabular-nums text-inactive">{inactive ?? 0}</span>
              </div>
            ) : (
              <p className="mt-1 text-[26px] font-bold leading-none tabular-nums">{percentText(filled, capacity)}</p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
