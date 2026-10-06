export function percent(filled: number, capacity: number): number | null {
  if (!capacity) return null;
  return Math.round((filled / capacity) * 100);
}

export function percentText(filled: number, capacity: number): string {
  const value = percent(filled, capacity);
  return value == null ? "—" : `${value}%`;
}

export function ratioText(ratio: number | null | undefined, decimals = 0): string {
  if (ratio == null || Number.isNaN(ratio)) return "—";
  return `${(ratio * 100).toFixed(decimals)}%`;
}

export function yoyText(current: number, last: number | null | undefined): string {
  if (last == null || last === 0) return "—";
  return `${Math.round((current / last) * 100)}%`;
}

export function formatRanOn(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${month}/${day}/${year}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** Contract charts in the PDF use a 0–800 axis unless the line climbs past it. */
export function contractAxisMax(values: number[]): number {
  const peak = Math.max(0, ...values);
  return Math.max(800, Math.ceil(peak / 100) * 100);
}

export function marketAxisMax(values: number[]): number {
  const peak = Math.max(0, ...values);
  const step = 2000;
  const ceil = Math.max(step, Math.ceil(peak / step) * step);
  return ceil - peak < step * 0.2 ? ceil + step : ceil;
}
