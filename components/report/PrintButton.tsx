"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border border-white/50 px-3 py-1 text-sm font-semibold text-white hover:bg-white/15"
    >
      Print
    </button>
  );
}
