"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Check, Copy, Download, List, RefreshCw } from "lucide-react";
import { regenerateReportShare, revokeReportShare } from "./actions";

export function CopyShareLinkButton({
  path,
  disabled = false
}: {
  path: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (disabled) return;
    const url = new URL(path, "https://riport.konverziohuszar.hu").toString();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--kh-navy)] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Másolva" : "Link másolása"}
    </button>
  );
}


export function BulkShareLinkActions({
  links
}: {
  links: Array<{ name: string; path: string; latestMonth: string }>;
}) {
  const [copied, setCopied] = useState(false);

  function buildRows() {
    return links.map((item) => ({
      ...item,
      url: new URL(item.path, "https://riport.konverziohuszar.hu").toString()
    }));
  }

  async function copyAll() {
    const text = buildRows()
      .map((item) => `${item.name}\t${item.url}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadCsv() {
    const rows = buildRows();
    const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [
      ["Ügyfél", "Legfrissebb riport", "Privát riport link"].map(escapeCsv).join(","),
      ...rows.map((item) =>
        [item.name, item.latestMonth, item.url].map(escapeCsv).join(",")
      )
    ].join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "konverziohuszar-ugyfel-riport-linkek.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copyAll}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--kh-navy)] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
      >
        {copied ? <Check size={16} /> : <List size={16} />}
        {copied ? "Lista másolva" : "Összes link másolása"}
      </button>
      <button
        type="button"
        onClick={downloadCsv}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--kh-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--kh-navy)] transition hover:bg-slate-50"
      >
        <Download size={16} />
        CSV letöltése
      </button>
    </div>
  );
}

export function ShareAdminActions({
  clientId,
  isActive
}: {
  clientId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function regenerate() {
    const message = isActive
      ? "Biztosan új linket kérsz? A régi link azonnal megszűnik működni."
      : "Újra aktiválod ezt az ügyfélriport-linket egy új privát URL-lel?";

    if (!window.confirm(message)) return;

    startTransition(async () => {
      await regenerateReportShare(clientId);
      router.refresh();
    });
  }

  function revoke() {
    if (!window.confirm("Biztosan visszavonod ezt a linket? Az ügyfél azonnal elveszíti a hozzáférést.")) {
      return;
    }

    startTransition(async () => {
      await revokeReportShare(clientId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={regenerate}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--kh-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--kh-navy)] transition hover:bg-slate-50 disabled:opacity-50"
      >
        <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
        {isActive ? "Új link" : "Aktiválás"}
      </button>
      {isActive && (
        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          <Ban size={14} />
          Visszavonás
        </button>
      )}
    </div>
  );
}
