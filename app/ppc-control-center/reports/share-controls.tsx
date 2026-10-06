"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Check, Copy, RefreshCw } from "lucide-react";
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
    const url = new URL(path, window.location.origin).toString();
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
