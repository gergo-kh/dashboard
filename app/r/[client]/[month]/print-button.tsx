"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 print:hidden"
    >
      Nyomtatás / PDF
    </button>
  );
}
