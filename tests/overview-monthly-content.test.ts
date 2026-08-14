import { describe, expect, it } from "vitest";
import {
  createEmptyMonthlyOverviewContent,
  createMonthlyOverviewContent,
  type MonthlyOverviewContentRows
} from "@/lib/overview/monthly-content";

const approvedRows = {
  monthlyReview: {
    id: "review-1",
    period_start: "2026-07-01",
    period_end: "2026-07-31",
    summary_approved: "A jóváhagyott havi összefoglaló Supabase-ből érkezik.",
    outcome_type: "mixed",
    outcome_items: [
      {
        label: "ROAS változás",
        value: "+12%",
        state: "positive"
      },
      {
        label: "Meta CPA",
        value: "+6%",
        state: "negative",
        explanation: "A kreatívfáradás növelte a költséget.",
        correctiveAction: "Új kreatívteszt indult."
      }
    ],
    corrective_actions: ["Új kreatívteszt indult."],
    next_month_plan: [
      {
        title: "Shopping fókusz",
        detail: "A fő termékkategóriák licitstruktúráját finomítjuk."
      }
    ],
    status: "approved",
    approved_at: "2026-08-02T08:15:00Z",
    updated_at: "2026-08-02T08:15:00Z",
    approved_by_profile: {
      full_name: "Teszt PPC manager"
    }
  },
  reports: [
    {
      id: "report-1",
      period_start: "2026-07-01",
      period_end: "2026-07-31",
      status: "published",
      generated_at: "2026-08-01T07:00:00Z",
      published_at: "2026-08-02T08:15:00Z",
      created_at: "2026-08-01T06:00:00Z"
    },
    {
      id: "report-2",
      period_start: "2026-06-01",
      period_end: "2026-06-30",
      status: "approved",
      generated_at: "2026-07-01T07:00:00Z",
      published_at: null,
      created_at: "2026-07-01T06:00:00Z"
    }
  ],
  optimizationItems: [
    {
      id: "work-1",
      title: "Feed attribútum ellenőrzés",
      description: "A hibás attribútumokat javítjuk.",
      category: "merchant_center",
      status: "in_progress",
      started_at: "2026-07-20T08:00:00Z",
      completed_at: null,
      created_at: "2026-07-19T08:00:00Z"
    },
    {
      id: "done-1",
      title: "Search-term takarítás",
      description: "A nem releváns keresési kifejezéseket kizártuk.",
      category: "google_ads",
      status: "completed",
      started_at: "2026-07-12T08:00:00Z",
      completed_at: "2026-07-14T08:00:00Z",
      created_at: "2026-07-10T08:00:00Z"
    }
  ],
  clientActionItems: [
    {
      id: "action-1",
      title: "Promóciós terméklista jóváhagyása",
      description: "A következő heti promócióhoz kérünk visszajelzést.",
      priority: "recommended",
      status: "open",
      affected_count: 12
    }
  ]
} satisfies MonthlyOverviewContentRows;

describe("monthly overview Supabase content mapping", () => {
  it("maps approved client-visible rows into the existing overview view model sections", () => {
    const content = createMonthlyOverviewContent(approvedRows);

    expect(content.monthlySummary.text).toBe(
      "A jóváhagyott havi összefoglaló Supabase-ből érkezik."
    );
    expect(content.monthlySummary.status).toBe("published");
    expect(content.monthlySummary.approvedByLabel).toContain("Teszt PPC manager");
    expect(content.monthlyOutcome.variant).toBe("mixed");
    expect(content.monthlyOutcome.items).toHaveLength(2);
    expect(content.currentWork[0]?.title).toBe("Feed attribútum ellenőrzés");
    expect(content.completedOptimizations[0]?.impactLabel).toBe("Google Ads");
    expect(content.clientActions[0]?.priorityLabel).toBe("Javasolt");
    expect(content.nextMonthPlan[0]?.title).toBe("Shopping fókusz");
    expect(content.reports.latestReport?.id).toBe("report-1");
    expect(content.reports.history[0]?.status).toBe("waiting_approval");
  });

  it("falls back to safe empty sections when monthly JSON content is malformed", () => {
    const content = createMonthlyOverviewContent({
      ...approvedRows,
      monthlyReview: approvedRows.monthlyReview
        ? {
            ...approvedRows.monthlyReview,
            outcome_items: [{ label: "", value: "", state: "positive" }],
            next_month_plan: [{ title: "", detail: "" }]
          }
        : null,
      optimizationItems: [],
      clientActionItems: [],
      reports: []
    });

    expect(content.monthlySummary.status).toBe("published");
    expect(content.monthlyOutcome.title).toBe("Havi értékelés még nem elérhető");
    expect(content.currentWork).toEqual([]);
    expect(content.clientActions).toEqual([]);
    expect(content.nextMonthPlan).toEqual([]);
    expect(content.reports.latestReport).toBeUndefined();
  });

  it("creates an explicit empty state when there is no approved monthly content", () => {
    const content = createEmptyMonthlyOverviewContent();

    expect(content.monthlySummary.status).toBe("draft");
    expect(content.monthlyOutcome.items[0]?.value).toBe("nincs publikált adat");
    expect(content.currentWork).toEqual([]);
    expect(content.completedOptimizations).toEqual([]);
  });
});
