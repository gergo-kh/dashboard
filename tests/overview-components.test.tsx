// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CompletedWorkCard,
  NextMonthPlanCard,
  WorkInProgressCard
} from "@/components/overview/action-cards";
import { MetricExplanationSheet } from "@/components/overview/metric-explanation-sheet";
import { OverviewHeader } from "@/components/overview/overview-header";
import { PerformanceChart } from "@/components/overview/performance-chart";
import { PortalMobileNav } from "@/components/portal/portal-mobile-nav";
import { ReportMiniCard } from "@/components/portal/portal-sidebar";
import { chartColorTokens } from "@/lib/overview/design-tokens";
import { createOverviewViewModel, createPortalShellViewModel } from "@/lib/overview/static-data";
import type { AccessibleProject } from "@/lib/auth/session";
import type { PropsWithChildren } from "react";

const navigationState = vi.hoisted(() => ({
  pathname: "/",
  push: vi.fn<(href: string) => void>(),
  searchParams: ""
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useRouter: () => ({
    push: navigationState.push
  }),
  useSearchParams: () => new URLSearchParams(navigationState.searchParams)
}));

vi.mock("@/app/(portal)/actions", () => ({
  signOutAction: vi.fn()
}));

vi.mock("recharts", async () => {
  const React = await import("react");
  type MockProps = PropsWithChildren<Record<string, unknown>>;
  const makeComponent = (name: string) =>
    function MockRechartsComponent({ children, ...props }: MockProps) {
      return React.createElement("div", {
        "data-chart-prop-data-length": Array.isArray(props.data) ? props.data.length : undefined,
        "data-recharts": name
      }, children);
    };

  return {
    Area: makeComponent("area"),
    AreaChart: makeComponent("area-chart"),
    CartesianGrid: makeComponent("cartesian-grid"),
    Legend: makeComponent("legend"),
    Line: makeComponent("line"),
    ResponsiveContainer: makeComponent("responsive-container"),
    Tooltip: makeComponent("tooltip"),
    XAxis: makeComponent("x-axis"),
    YAxis: makeComponent("y-axis")
  };
});

const projects = [
  {
    id: "project-demo-hu",
    client_id: "client-demo",
    name: "Demó HU",
    slug: "demo-hu",
    status: "active",
    country_code: "HU",
    market_label: "HU",
    currency_code: "HUF",
    timezone: "Europe/Budapest",
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
  },
  {
    id: "project-demo-ro",
    client_id: "client-demo",
    name: "Demó RO",
    slug: "demo-ro",
    status: "active",
    country_code: "RO",
    market_label: "RO",
    currency_code: "RON",
    timezone: "Europe/Bucharest",
    roas_target: "3.8",
    report_day: 5,
    assigned_manager_profile_id: "manager-1",
    client: { id: "client-demo", name: "Demó ügyfél", slug: "demo-client" },
    assignedManager: {
      id: "manager-1",
      full_name: "Teszt PPC manager",
      email: "manager@example.invalid",
      avatar_url: null
    }
  }
] satisfies AccessibleProject[];

const overview = createOverviewViewModel({
  profileName: "Agency Admin",
  projects,
  role: "agency_admin",
  selectedProject: projects[0] ?? null,
  monthlyContent: null,
  metricsContent: null,
  merchantContent: null
});

const shell = createPortalShellViewModel({
  profileName: "Agency Admin",
  projects,
  role: "agency_admin",
  selectedProject: projects[0] ?? null,
  monthlyContent: null,
  metricsContent: null,
  merchantContent: null
});

afterEach(() => {
  cleanup();
  navigationState.pathname = "/";
  navigationState.searchParams = "";
  navigationState.push.mockReset();
});

function getButton(name: string) {
  return screen.getByRole("button", { name }) as HTMLButtonElement;
}

describe("overview interaction hardening", () => {
  it("switches chart intervals with aria-pressed state updates", async () => {
    const user = userEvent.setup();
    render(createElement(PerformanceChart, { chart: overview.performanceChart }));

    const daily = getButton("Napi");
    const weekly = getButton("Heti");
    const monthly = getButton("Havi");

    expect(daily.getAttribute("aria-pressed")).toBe("true");
    expect(weekly.getAttribute("aria-pressed")).toBe("false");

    await user.click(weekly);
    expect(daily.getAttribute("aria-pressed")).toBe("false");
    expect(weekly.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("Heti nézet");

    await user.click(monthly);
    expect(monthly.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("Havi nézet");
  });

  it("uses CSS custom property design tokens for chart colors", () => {
    expect(Object.values(chartColorTokens).every((value) => value.startsWith("var(--kh-"))).toBe(
      true
    );
  });

  it("renders agency project selector as an active URL-persisted control", async () => {
    const user = userEvent.setup();
    render(createElement(OverviewHeader, { header: overview.header }));

    const projectSelector = screen.getByLabelText("Projekt kiválasztása") as HTMLSelectElement;

    expect(projectSelector.disabled).toBe(false);
    expect(projectSelector.value).toBe("project-demo-hu");
    expect(screen.getByText("A projektváltás az URL-ben is megmarad.")).toBeTruthy();

    await user.selectOptions(projectSelector, "project-demo-ro");
    expect(navigationState.push).toHaveBeenCalledWith("/?projectId=project-demo-ro");
  });

  it("preserves existing URL params when agency switches project", async () => {
    const user = userEvent.setup();
    navigationState.pathname = "/";
    navigationState.searchParams = "view=overview";
    render(createElement(OverviewHeader, { header: overview.header }));

    await user.selectOptions(screen.getByLabelText("Projekt kiválasztása"), "project-demo-ro");
    expect(navigationState.push).toHaveBeenCalledWith("/?view=overview&projectId=project-demo-ro");
  });

  it("keeps client project selector and other static controls intentionally disabled", () => {
    const clientOverview = createOverviewViewModel({
      profileName: "Client User",
      projects: [projects[0]],
      role: "client_user",
      selectedProject: projects[0] ?? null,
      monthlyContent: null,
      metricsContent: null,
      merchantContent: null
    });

    render(createElement(OverviewHeader, { header: clientOverview.header }));

    expect((screen.getByLabelText("Projekt kiválasztása") as HTMLSelectElement).disabled).toBe(
      true
    );
    expect((screen.getByLabelText("Időszak kiválasztása") as HTMLSelectElement).disabled).toBe(
      true
    );
    expect(
      (screen.getByLabelText("Összehasonlítás kiválasztása") as HTMLSelectElement).disabled
    ).toBe(true);
    expect(screen.getByText("A kliensfiók csak a saját projektjét használhatja.")).toBeTruthy();
    expect(getButton("Kérdezd az AI-t Hamarosan").disabled).toBe(true);
    expect(getButton("Riport letöltése").disabled).toBe(true);
    expect(
      screen.getByText("Az AI kérdezés és a PDF letöltés a későbbi fázisban lesz elérhető.")
    ).toBeTruthy();
  });

  it("does not leave sidebar report actions as no-op clickable controls", () => {
    render(createElement(ReportMiniCard, { shell }));

    expect(getButton("Megtekintés").disabled).toBe(true);
    expect(getButton("Letöltés").disabled).toBe(true);
    expect(
      screen.getByText("A riport megnyitása és letöltése későbbi fázisban készül el.")
    ).toBeTruthy();
  });

  it("opens and closes the mobile drawer with labelled controls", async () => {
    const user = userEvent.setup();
    render(createElement(PortalMobileNav, { shell }));

    await user.click(getButton("Mobil menü megnyitása"));
    expect(screen.getByRole("dialog", { name: "Mobil navigáció" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Teljesítmény Hamarosan" }) as HTMLButtonElement).disabled).toBe(true);

    await user.click(getButton("Mobil menü bezárása"));
    expect(screen.queryByRole("dialog", { name: "Mobil navigáció" })).toBeNull();
  });

  it("closes dialogs with labelled buttons and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(createElement(MetricExplanationSheet, { explanation: overview.metricExplanation }));

    const trigger = getButton("Hogyan számoljuk ezeket a mutatókat?");
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Mutatók számítása" })).toBeTruthy();

    await user.click(getButton("Mutató magyarázat bezárása"));
    expect(screen.queryByRole("dialog", { name: "Mutatók számítása" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes completed-work sheet with Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(createElement(CompletedWorkCard, { items: overview.completedOptimizations }));

    const trigger = getButton("+ 12 további optimalizálás megtekintése");
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Elvégzett optimalizálások" })).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Elvégzett optimalizálások" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("renders explicit empty states for missing monthly Supabase content", () => {
    render(createElement(WorkInProgressCard, { items: [] }));
    expect(
      screen.getByText("Most nincs ügyféloldalon megjeleníthető aktuális munka ehhez a projekthez.")
    ).toBeTruthy();

    cleanup();
    render(createElement(CompletedWorkCard, { items: [] }));
    expect(screen.getByText("Ehhez a projekthez még nincs publikált elvégzett optimalizálás.")).toBeTruthy();

    cleanup();
    render(createElement(NextMonthPlanCard, { items: [] }));
    expect(screen.getByText("A következő havi terv még nincs publikálva.")).toBeTruthy();
  });
});
