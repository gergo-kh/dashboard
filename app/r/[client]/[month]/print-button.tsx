"use client";

import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#0b1739] shadow-sm transition hover:border-slate-300 hover:bg-slate-50 print:hidden"
    >
      <Download className="h-4 w-4" />
      PDF letöltése
    </button>
  );
}
