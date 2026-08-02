import type { AccessibleProject } from "@/lib/auth/session";
import type {
  AttentionProduct,
  ChannelSummary,
  CompletedOptimizationItem,
  CurrentWorkItem,
  KpiCardViewModel,
  MonthlyOutcomeState,
  NextMonthPlanItem,
  OverviewDataContext,
  OverviewHeaderViewModel,
  OverviewViewModel,
  PerformanceChartViewModel,
  PortalShellViewModel,
  ReportsViewModel,
  ClientActionItem
} from "@/types/overview";

const fallbackProjectId = "eroll-hu-static";

function getProjectMarketLabel(projectName: string) {
  const upperName = projectName.toUpperCase();

  if (upperName.includes("HU")) {
    return "HU";
  }

  if (upperName.includes("RO")) {
    return "RO";
  }

  if (upperName.includes("HR")) {
    return "HR";
  }

  if (upperName.includes("EU")) {
    return "EU";
  }

  return "HU";
}

function getSelectedProject(projects: AccessibleProject[]) {
  return (
    projects.find((project) => project.slug === "eroll-hu") ??
    projects[0] ?? {
      id: fallbackProjectId,
      name: "Eroll HU",
      slug: "eroll-hu",
      status: "active",
      client_id: "eroll-static",
      client: {
        id: "eroll-static",
        name: "Eroll",
        slug: "eroll"
      }
    }
  );
}

export function createProjectSelectorItems(projects: AccessibleProject[]) {
  const selectedProject = getSelectedProject(projects);
  const sourceProjects = projects.length > 0 ? projects : [selectedProject];

  return sourceProjects.map((project) => ({
    id: project.id,
    name: `${project.name} (${getProjectMarketLabel(project.name)})`,
    clientName: project.client?.name ?? "Eroll",
    marketLabel: getProjectMarketLabel(project.name),
    isSelected: project.id === selectedProject.id,
    isAccessible: projects.length > 0
  }));
}

const kpis: KpiCardViewModel[] = [
  {
    id: "spend",
    title: "Költés",
    currentValue: "19,8 M Ft",
    comparisonPercentage: "+10,3%",
    comparisonLabel: "az előző hónaphoz képest",
    state: "negative",
    tooltip: "Összes aktív fizetett csatorna médiaköltése.",
    supportingLabel: "Google, Meta és TikTok együtt"
  },
  {
    id: "revenue",
    title: "Bevétel (GA4)",
    currentValue: "92,4 M Ft",
    comparisonPercentage: "+14,6%",
    comparisonLabel: "az előző hónaphoz képest",
    state: "positive",
    tooltip: "GA4 ecommerce purchase revenue a kiválasztott projektben.",
    supportingLabel: "GA4 vásárlási bevétel"
  },
  {
    id: "roas",
    title: "ROAS (Blended)",
    currentValue: "4,67",
    comparisonPercentage: "+18%",
    comparisonLabel: "az előző hónaphoz képest",
    state: "positive",
    tooltip: "GA4 bevétel osztva az összes fizetett média költéssel.",
    supportingLabel: "Cél: 4,2"
  },
  {
    id: "purchases",
    title: "Vásárlások (GA4)",
    currentValue: "3 482",
    comparisonPercentage: "+9,8%",
    comparisonLabel: "az előző hónaphoz képest",
    state: "positive",
    tooltip: "GA4 purchase események száma.",
    supportingLabel: "Webshop vásárlások"
  },
  {
    id: "cpa",
    title: "CPA (Blended)",
    currentValue: "5 686 Ft",
    comparisonPercentage: "-22%",
    comparisonLabel: "az előző hónaphoz képest",
    state: "positive",
    tooltip: "Teljes médiaköltés osztva a GA4 vásárlások számával.",
    supportingLabel: "Alacsonyabb érték jobb"
  },
  {
    id: "aov",
    title: "Átlagos rendelési érték",
    currentValue: "26 536 Ft",
    comparisonPercentage: "+4,2%",
    comparisonLabel: "az előző hónaphoz képest",
    state: "positive",
    tooltip: "GA4 bevétel osztva a GA4 vásárlások számával.",
    supportingLabel: "Kosárérték"
  }
];

export const monthlyOutcomeExamples: Record<"positive" | "mixed" | "weak", MonthlyOutcomeState> = {
  positive: {
    variant: "positive",
    title: "Ebben a hónapban elért eredmények",
    summary: "A fő üzleti mutatók javultak, miközben a feedhibák száma látványosan csökkent.",
    items: [
      { label: "ROAS javulás", value: "+18%", state: "positive" },
      { label: "CPA csökkenés", value: "-22%", state: "positive" },
      { label: "Bevételnövekedés", value: "+2,8 M Ft", state: "positive" },
      { label: "Merchant hibák", value: "42 → 8", state: "positive" }
    ]
  },
  mixed: {
    variant: "mixed",
    title: "Fontos változások ebben a hónapban",
    summary: "A bevétel nőtt, de a Meta költés hatékonyságát tovább finomítjuk.",
    items: [
      { label: "Shopping bevétel", value: "+16%", state: "positive" },
      { label: "Meta CPA", value: "+9%", state: "negative", correctiveAction: "Új kreatívteszt fut, a gyengébb hirdetéseket leállítottuk." },
      { label: "GA4 vásárlások", value: "+4%", state: "positive" },
      { label: "TikTok tanulási fázis", value: "stabil", state: "neutral" }
    ]
  },
  weak: {
    variant: "weak",
    title: "Kiemelt fókuszterületek",
    summary: "A hónap gyengébb eredményeire konkrét javítási tervvel reagálunk.",
    items: [
      {
        label: "ROAS változás",
        value: "-21%",
        state: "negative",
        explanation: "A Shopping aukciós verseny erősödött a fő kategóriákban.",
        correctiveAction: "A kampánystruktúrát termékmarzs szerint bontjuk újra."
      },
      {
        label: "Bevétel változás",
        value: "-12,8%",
        state: "negative",
        explanation: "A legnagyobb termékkategóriában visszaesett a kereslet.",
        correctiveAction: "Kiemelt promóciós terméklistát készítünk a következő hétre."
      },
      {
        label: "CPA változás",
        value: "+18%",
        state: "negative",
        explanation: "Több nem releváns keresési kifejezés kapott forgalmat.",
        correctiveAction: "Search-term cleanup és negatív kulcsszó bővítés fut."
      }
    ],
    focusAreas: [
      "Shopping kampánystruktúra javítása",
      "Merchant feed minőség emelése",
      "Meta kreatívok frissítése"
    ],
    correctiveActions: [
      "Termékmarzs alapú Shopping bontás",
      "Kiemelt feedhibák lezárása",
      "Gyenge kreatívok cseréje és új teszt indítása"
    ]
  }
};

const performanceChart: PerformanceChartViewModel = {
  title: "Teljesítmény alakulása",
  state: "normal",
  granularity: "daily",
  summary:
    "A júliusi időszakban a bevétel a hónap második felében gyorsult, a ROAS stabilan a cél felett maradt.",
  emptyMessage: "Ehhez az időszakhoz még nincs megjeleníthető teljesítményadat.",
  errorMessage: "A teljesítményadatok most nem tölthetők be.",
  series: [
    { label: "júl. 1.", revenue: 2400000, spend: 620000, roas: 3.87 },
    { label: "júl. 4.", revenue: 3100000, spend: 680000, roas: 4.56 },
    { label: "júl. 7.", revenue: 2850000, spend: 640000, roas: 4.45 },
    { label: "júl. 10.", revenue: 3600000, spend: 710000, roas: 5.07 },
    { label: "júl. 13.", revenue: 3320000, spend: 735000, roas: 4.52 },
    { label: "júl. 16.", revenue: 4050000, spend: 780000, roas: 5.19 },
    { label: "júl. 19.", revenue: 3880000, spend: 760000, roas: 5.11 },
    { label: "júl. 22.", revenue: 4380000, spend: 810000, roas: 5.41 },
    { label: "júl. 25.", revenue: 4210000, spend: 795000, roas: 5.3 },
    { label: "júl. 28.", revenue: 4700000, spend: 850000, roas: 5.53 },
    { label: "júl. 31.", revenue: 4980000, spend: 875000, roas: 5.69 }
  ],
  intervals: [
    {
      value: "daily",
      label: "Napi",
      summary:
        "Napi nézet: a bevétel a hónap második felében gyorsult, a ROAS stabilan a cél felett maradt.",
      series: [
        { label: "júl. 1.", revenue: 2400000, spend: 620000, roas: 3.87 },
        { label: "júl. 4.", revenue: 3100000, spend: 680000, roas: 4.56 },
        { label: "júl. 7.", revenue: 2850000, spend: 640000, roas: 4.45 },
        { label: "júl. 10.", revenue: 3600000, spend: 710000, roas: 5.07 },
        { label: "júl. 13.", revenue: 3320000, spend: 735000, roas: 4.52 },
        { label: "júl. 16.", revenue: 4050000, spend: 780000, roas: 5.19 },
        { label: "júl. 19.", revenue: 3880000, spend: 760000, roas: 5.11 },
        { label: "júl. 22.", revenue: 4380000, spend: 810000, roas: 5.41 },
        { label: "júl. 25.", revenue: 4210000, spend: 795000, roas: 5.3 },
        { label: "júl. 28.", revenue: 4700000, spend: 850000, roas: 5.53 },
        { label: "júl. 31.", revenue: 4980000, spend: 875000, roas: 5.69 }
      ]
    },
    {
      value: "weekly",
      label: "Heti",
      summary:
        "Heti nézet: július utolsó két hete hozta a legerősebb bevételt és a legjobb ROAS-t.",
      series: [
        { label: "27. hét", revenue: 8450000, spend: 1940000, roas: 4.36 },
        { label: "28. hét", revenue: 10880000, spend: 2175000, roas: 5.0 },
        { label: "29. hét", revenue: 12060000, spend: 2315000, roas: 5.21 },
        { label: "30. hét", revenue: 13290000, spend: 2455000, roas: 5.41 },
        { label: "31. hét", revenue: 14610000, spend: 2550000, roas: 5.73 }
      ]
    },
    {
      value: "monthly",
      label: "Havi",
      summary:
        "Havi nézet: májustól júliusig a bevétel és a blended ROAS is fokozatosan emelkedett.",
      series: [
        { label: "május", revenue: 74600000, spend: 18100000, roas: 4.12 },
        { label: "június", revenue: 80600000, spend: 17950000, roas: 4.49 },
        { label: "július", revenue: 92400000, spend: 19800000, roas: 4.67 }
      ]
    }
  ]
};

const channelSummary: ChannelSummary = {
  title: "Csatornák összefoglalója",
  rows: [
    {
      channel: "Google Ads",
      status: "active",
      statusLabel: "Aktív",
      spendLabel: "13,2 M Ft",
      revenueLabel: "Platform bevétel: 74,8 M Ft",
      roasLabel: "5,67",
      spendShareLabel: "67%",
      note: "Shopping és PMax fókusz"
    },
    {
      channel: "Meta Ads",
      status: "attention",
      statusLabel: "Figyelmet kér",
      spendLabel: "5,1 M Ft",
      revenueLabel: "Platform bevétel: 18,6 M Ft",
      roasLabel: "3,65",
      spendShareLabel: "26%",
      note: "Új kreatívteszt fut"
    },
    {
      channel: "TikTok Ads",
      status: "stable",
      statusLabel: "Tanulási fázis",
      spendLabel: "1,5 M Ft",
      revenueLabel: "Platform bevétel: 3,8 M Ft",
      roasLabel: "2,53",
      spendShareLabel: "7%",
      note: "Korlátozott költéssel"
    },
    {
      channel: "GA4",
      status: "source",
      statusLabel: "Adatforrás",
      spendLabel: "nem médiaköltés",
      revenueLabel: "GA4 bevétel: 92,4 M Ft",
      roasLabel: "projekt szint",
      spendShareLabel: "n/a",
      note: "Webshop szintű mérés"
    }
  ],
  totalRow: {
    channel: "Összesen",
    status: "active",
    statusLabel: "GA4 alapú összesítés",
    spendLabel: "19,8 M Ft",
    revenueLabel: "GA4 bevétel: 92,4 M Ft",
    roasLabel: "4,67",
    spendShareLabel: "100%"
  },
  footnote:
    "A platformon jelentett bevételek átfedhetnek, ezért nem összeadhatók. Az összes sor GA4 bevételt és teljes paid-media költést használ."
};

const currentWork: CurrentWorkItem[] = [
  {
    title: "Shopping kampányok optimalizálása",
    description: "A magas potenciálú termékcsoportok nagyobb fókuszt kapnak.",
    statusLabel: "Folyamatban",
    startedAtLabel: "Indítva: július 24."
  },
  {
    title: "Merchant feed javítása",
    description: "A title, GTIN és képminőségi hibák csökkentésén dolgozunk.",
    statusLabel: "Folyamatban",
    startedAtLabel: "Indítva: július 22."
  },
  {
    title: "Meta kreatív tesztelés",
    description: "Új termékfókuszú kreatívok futnak kontroll hirdetések mellett.",
    statusLabel: "Teszt alatt",
    startedAtLabel: "Indítva: július 29."
  }
];

const completedOptimizations: CompletedOptimizationItem[] = [
  { title: "34 negatív kulcsszó hozzáadása", detail: "Nem releváns keresések kizárása Shopping és Search kampányokból.", impactLabel: "CPA védelem" },
  { title: "12 keresési kifejezés kizárása", detail: "Gyenge minőségű, magas költségű kifejezések tisztítása.", impactLabel: "Költéskontroll" },
  { title: "5 PMax asset csoport frissítése", detail: "Kategóriaüzenetek és termékképek pontosítása.", impactLabel: "ROAS javítás" },
  { title: "Merchant feed optimalizálása", detail: "Hiányos attribútumok és termékcímek javítási listája elkészült.", impactLabel: "Feedminőség" },
  { title: "ROAS cél módosítása", detail: "A célértéket a júliusi margin és készlethelyzet alapján finomítottuk.", impactLabel: "Profitfókusz" },
  { title: "Meta kreatívcsere", detail: "A gyengébb kreatívokat friss termékalapú üzenetek váltották.", impactLabel: "Tanulás gyorsítás" }
];

const clientActions: ClientActionItem[] = [
  {
    title: "18 termék title javítása",
    detail: "A fő kulcsszavak hiányoznak a termékcímekből.",
    priority: "urgent",
    priorityLabel: "Sürgős"
  },
  {
    title: "6 termékhez hiányzik GTIN",
    detail: "A Merchant jóváhagyási arányt és Shopping lefedettséget érinti.",
    priority: "recommended",
    priorityLabel: "Javasolt"
  },
  {
    title: "3 termékhez nincs kép",
    detail: "Kép nélkül ezek a termékek nem tudnak megfelelően megjelenni.",
    priority: "opportunity",
    priorityLabel: "Fejlesztési lehetőség"
  }
];

const nextMonthPlan: NextMonthPlanItem[] = [
  { title: "Shopping ROAS növelése", detail: "Termékcsoportonként külön célértékekkel dolgozunk." },
  { title: "Merchant hibák megszüntetése", detail: "A legnagyobb forgalmú termékek hibáit vesszük előre." },
  { title: "Új Meta kreatívok tesztelése", detail: "Kategória és bestseller üzeneteket hasonlítunk össze." },
  { title: "Konverziós arány növelése", detail: "A landing oldali és ajánlati súrlódásokat figyeljük." }
];

const reports: ReportsViewModel = {
  title: "Havi riportok",
  latestReport: {
    id: "report-2026-07",
    monthLabel: "Júliusi riport",
    createdAtLabel: "2026. augusztus 2.",
    status: "published",
    statusLabel: "Elkészült"
  },
  history: [
    { id: "report-2026-06", monthLabel: "Júniusi riport", createdAtLabel: "2026. július 2.", status: "published", statusLabel: "Elkészült" },
    { id: "report-2026-05", monthLabel: "Májusi riport", createdAtLabel: "2026. június 3.", status: "published", statusLabel: "Elkészült" },
    { id: "report-2026-04", monthLabel: "Áprilisi riport", createdAtLabel: "2026. május 2.", status: "published", statusLabel: "Elkészült" }
  ]
};

const attentionProducts: AttentionProduct[] = [
  { id: "p-01", name: "Eroll Flex Pro deréktámasz", sku: "ER-HU-1024", spendLabel: "684 000 Ft", revenueLabel: "1,1 M Ft", roasLabel: "1,61", issue: "low_efficiency", issueLabel: "alacsony hatékonyság", detail: "A költés magasabb, mint amit a termék ROAS-a indokol." },
  { id: "p-02", name: "Eroll Office Max szék", sku: "ER-HU-2241", spendLabel: "512 000 Ft", revenueLabel: "620 000 Ft", roasLabel: "1,21", issue: "high_spend_low_purchase", issueLabel: "magas költés, kevés vásárlás", detail: "Sok kattintás után kevés vásárlás érkezik." },
  { id: "p-03", name: "Eroll Basic állítható karfa", sku: "ER-HU-3188", spendLabel: "86 000 Ft", revenueLabel: "0 Ft", roasLabel: "nincs adat", issue: "missing_gtin", issueLabel: "hiányzó GTIN", detail: "Az azonosító hiánya korlátozza a Merchant megjelenést." },
  { id: "p-04", name: "Eroll Comfort Plus ülőlap", sku: "ER-HU-4410", spendLabel: "192 000 Ft", revenueLabel: "255 000 Ft", roasLabel: "1,33", issue: "poor_feed_quality", issueLabel: "gyenge feedminőség", detail: "A title és leírás nem tartalmazza a fő termékelőnyöket." },
  { id: "p-05", name: "Eroll Mesh háttámla", sku: "ER-HU-5172", spendLabel: "74 000 Ft", revenueLabel: "nincs adat", roasLabel: "nincs adat", issue: "disapproved", issueLabel: "elutasított termék", detail: "Merchant policy ellenőrzés szükséges." },
  { id: "p-06", name: "Eroll Executive fejtámla", sku: "ER-HU-6301", spendLabel: "118 000 Ft", revenueLabel: "186 000 Ft", roasLabel: "1,58", issue: "poor_feed_quality", issueLabel: "gyenge feedminőség", detail: "A képek és attribútumok javítása várhatóan növeli a lefedettséget." }
];

function createHeader(context: OverviewDataContext): OverviewHeaderViewModel {
  const selector = createProjectSelectorItems(context.projects);
  const selected = selector.find((project) => project.isSelected) ?? selector[0];

  return {
    title: "Marketing áttekintés",
    subtitle: "Eroll HU júliusi teljesítménye és a KonverzióHuszár aktuális munkája.",
    projectSelector: selector,
    selectedProjectName: selected?.name ?? "Nincs elérhető projekt",
    selectedClientName: selected?.clientName ?? "Nincs kiválasztott ügyfél",
    managementActivity: {
      label: "A KonverzióHuszár aktívan dolgozik a fiókodon",
      lastOptimizationLabel: "Utolsó optimalizálás: 2 napja",
      monthlyOptimizationCount: 18,
      state: "active"
    },
    dateRanges: [
      { value: "this_month", label: "Július", isSelected: true },
      { value: "last_30_days", label: "Elmúlt 30 nap", isSelected: false },
      { value: "quarter", label: "Negyedév", isSelected: false }
    ],
    comparisons: [
      { value: "previous_period", label: "Előző időszak", isSelected: true },
      { value: "previous_month", label: "Előző hónap", isSelected: false },
      { value: "previous_year", label: "Előző év", isSelected: false }
    ],
    roasTarget: "ROAS cél: 4,2",
    lastRefreshLabel: "Utolsó adatfrissítés: ma 06:10"
  };
}

export function createOverviewViewModel(context: OverviewDataContext): OverviewViewModel {
  return {
    header: createHeader(context),
    monthlySummary: {
      title: "Havi összefoglaló",
      text:
        "Júliusban 18 optimalizálást végeztünk el. A bevétel 14,6%-kal nőtt, miközben a költség csak 10,3%-kal emelkedett. A fő fókusz a Shopping kampányok és a Merchant feed javítása volt. Augusztusban a konverziós arány növelésére koncentrálunk.",
      status: "published",
      statusLabel: "Jóváhagyva és publikálva",
      monthLabel: "2026. július",
      lastUpdatedLabel: "Frissítve: 2026. augusztus 2. 08:15",
      approvedByLabel: "Jóváhagyta: KonverzióHuszár"
    },
    monthlyOutcome: monthlyOutcomeExamples.positive,
    kpis,
    metricExplanation: {
      dataSource: "GA4 ecommerce bevétel, Google Ads, Meta Ads és TikTok Ads médiaköltés.",
      formula: "Blended ROAS = GA4 ecommerce bevétel / teljes paid-media költés.",
      platformDifference:
        "A platformok saját attribúciót használnak, ezért ugyanazt a vásárlást több rendszer is magának tulajdoníthatja.",
      attributionLimitations:
        "A cookie, consent és cross-device hatások miatt a riport üzleti iránytű, nem könyvelési kimutatás.",
      lastRefresh: "Utolsó adatfrissítés: ma 06:10"
    },
    performanceChart,
    channelSummary,
    currentWork,
    completedOptimizations,
    clientActions,
    nextMonthPlan,
    reports,
    attentionProducts
  };
}

export function createPortalShellViewModel(context: OverviewDataContext): PortalShellViewModel {
  const overview = createOverviewViewModel(context);

  return {
    userName: context.profileName,
    roleLabel: context.role === "agency_admin" ? "Ügynökségi admin" : "Ügyfél",
    selectedClientName: overview.header.selectedClientName,
    selectedProjectName: overview.header.selectedProjectName,
    ppcManagerName: "Kiss Gergő",
    currentReport: reports.latestReport ?? {
      id: "missing-report",
      monthLabel: "Júliusi riport",
      createdAtLabel: "nincs adat",
      status: "draft",
      statusLabel: "Készül"
    },
    accessibleProjectCount: context.projects.length
  };
}
