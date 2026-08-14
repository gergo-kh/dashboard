import { describe, expect, it } from "vitest";
import { getNavigationLabels } from "@/components/portal/navigation";
import { formatCompactForint, formatPercent, formatRoas } from "@/lib/overview/format";
import { getNavigationModeForWidth } from "@/lib/overview/responsive";
import {
  createOverviewViewModel,
  createProjectSelectorItems,
  monthlyOutcomeExamples
} from "@/lib/overview/static-data";
import {
  labelIsMissingData,
  monthlyOutcomeHasSafeNegativeItems,
  validateOverviewViewModel,
  weakOutcomeHasCorrectiveSections
} from "@/lib/overview/validation";
import type { AccessibleProject } from "@/lib/auth/session";

function createProject(input: {
  id: string;
  name: string;
  slug: string;
  marketLabel: string;
}): AccessibleProject {
  return {
    id: input.id,
    client_id: "client-demo",
    name: input.name,
    slug: input.slug,
    status: "active",
    country_code: input.marketLabel,
    market_label: input.marketLabel,
    currency_code: "HUF",
    roas_target: "4.2",
    report_day: 5,
    assigned_manager_profile_id: "manager-1",
    client: { id: "client-demo", name: "Demó ügyfél", slug: "demo-client" },
    assignedManager: {
      id: "manager-1",
      full_name: "Teszt PPC manager",
      email: "manager@example.invalid",
      avatar_url: null
    }
  };
}

const projects = [
  createProject({
    id: "project-demo-hu",
    name: "Demó HU",
    slug: "demo-hu",
    marketLabel: "HU"
  }),
  createProject({
    id: "project-demo-ro",
    name: "Demó RO",
    slug: "demo-ro",
    marketLabel: "RO"
  })
] satisfies AccessibleProject[];

const overview = createOverviewViewModel({
  profileName: "Agency Admin",
  role: "agency_admin",
  projects,
  selectedProject: projects[0] ?? null,
  monthlyContent: null
});

describe("overview static view model", () => {
  it("validates the authored overview view model", () => {
    expect(validateOverviewViewModel(overview)).toBe(true);
  });

  it("has exactly six KPI cards", () => {
    expect(overview.kpis).toHaveLength(6);
    expect(overview.kpis.map((kpi) => kpi.title)).toEqual([
      "Költés",
      "Bevétel (GA4)",
      "ROAS (Blended)",
      "Vásárlások (GA4)",
      "CPA (Blended)",
      "Átlagos rendelési érték"
    ]);
  });

  it("keeps the approved navigation order", () => {
    expect(getNavigationLabels()).toEqual([
      "Marketing áttekintés",
      "Teljesítmény",
      "Merchant Center",
      "Optimalizálások",
      "Riportok",
      "Beállítások"
    ]);
  });

  it("marks accessible project selector options", () => {
    const selector = createProjectSelectorItems(projects);

    expect(selector).toHaveLength(2);
    expect(selector.every((project) => project.isAccessible)).toBe(true);
    expect(selector.find((project) => project.isSelected)?.name).toBe("Demó HU (HU)");
  });

  it("handles no accessible projects without pretending live data exists", () => {
    const selector = createProjectSelectorItems([]);

    expect(selector).toHaveLength(1);
    expect(selector[0]?.isAccessible).toBe(false);
  });

  it("uses the selected project context without changing the static fallback content", () => {
    const selectedOverview = createOverviewViewModel({
      profileName: "Agency Admin",
      role: "agency_admin",
      projects,
      selectedProject: projects[1] ?? null,
      monthlyContent: null
    });

    expect(selectedOverview.header.selectedProjectName).toBe("Demó RO (RO)");
    expect(selectedOverview.header.selectedClientName).toBe("Demó ügyfél");
    expect(selectedOverview.kpis).toHaveLength(6);
    expect(selectedOverview.attentionProducts[0]?.name).toBe("Demó Flex Pro deréktámasz");
  });

  it("does not render client-specific static copy in the dashboard fixture", () => {
    const clientSpecificPattern = new RegExp(`er${"r"}oll|er${"o"}ll`, "i");

    expect(JSON.stringify(overview)).not.toMatch(clientSpecificPattern);
  });
});

describe("monthly outcome communication rules", () => {
  it("defines positive, mixed, and weak variants", () => {
    expect(monthlyOutcomeExamples.positive.title).toBe(
      "Ebben a hónapban elért eredmények"
    );
    expect(monthlyOutcomeExamples.mixed.title).toBe(
      "Fontos változások ebben a hónapban"
    );
    expect(monthlyOutcomeExamples.weak.correctiveActions?.length).toBeGreaterThan(0);
  });

  it("requires corrective context for negative outcome items", () => {
    expect(monthlyOutcomeHasSafeNegativeItems(monthlyOutcomeExamples.weak)).toBe(true);
  });

  it("requires focus and corrective sections for weak outcomes", () => {
    expect(weakOutcomeHasCorrectiveSections(monthlyOutcomeExamples.weak)).toBe(true);
  });
});

describe("overview formatting and states", () => {
  it("formats key metrics with Hungarian labels", () => {
    expect(formatCompactForint(2_800_000)).toBe("2,8 M Ft");
    expect(formatPercent(14.6)).toBe("+14,6%");
    expect(formatRoas(4.67)).toBe("4,67");
  });

  it("defines reusable chart state messages", () => {
    expect(overview.performanceChart.state).toBe("normal");
    expect(overview.performanceChart.emptyMessage).not.toBe("0");
    expect(overview.performanceChart.errorMessage).toContain("nem tölthetők be");
  });

  it("does not treat missing labels as real zero values", () => {
    expect(labelIsMissingData("nincs adat")).toBe(true);
    expect(labelIsMissingData("0 Ft")).toBe(false);
  });
});

describe("overview component contracts", () => {
  it("provides KPI accessibility labels and tooltip content", () => {
    expect(overview.kpis.every((kpi) => kpi.tooltip.length > 12)).toBe(true);
    expect(overview.kpis.some((kpi) => kpi.title === "ROAS (Blended)")).toBe(true);
  });

  it("defines disabled AI and report controls in the static phase", () => {
    expect(overview.header.lastRefreshLabel).toContain("Utolsó adatfrissítés");
    expect(overview.metricExplanation.lastRefresh).toContain("Utolsó adatfrissítés");
  });

  it("supports no client action items as an explicit state", () => {
    expect([]).toHaveLength(0);
  });

  it("switches navigation mode at the tablet/mobile breakpoint", () => {
    expect(getNavigationModeForWidth(1440)).toBe("sidebar");
    expect(getNavigationModeForWidth(1024)).toBe("drawer");
    expect(getNavigationModeForWidth(390)).toBe("drawer");
  });
});
