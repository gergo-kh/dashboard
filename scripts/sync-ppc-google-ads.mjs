const requiredEnv = [
  "WINDSOR_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKFILL_DAYS = Math.max(1, Math.min(14, Number(process.env.PPC_BACKFILL_DAYS ?? 7)));
const TIME_ZONE = process.env.PPC_TIME_ZONE ?? "Europe/Budapest";
const WINDSOR_BASE_URL = "https://connectors.windsor.ai/google_ads";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  return new Date(`${value}T12:00:00.000Z`);
}

function addDays(value, delta) {
  const date = typeof value === "string" ? parseDate(value) : new Date(value);
  date.setUTCDate(date.getUTCDate() + delta);
  return formatDate(date);
}

function firstDayOfMonth(value) {
  const date = parseDate(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function previousMonthSameElapsedRange(value) {
  const date = parseDate(value);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const previousMonthEnd = new Date(Date.UTC(year, month, 0, 12));
  const previousMonthStart = new Date(Date.UTC(previousMonthEnd.getUTCFullYear(), previousMonthEnd.getUTCMonth(), 1, 12));
  const previousDay = Math.min(day, previousMonthEnd.getUTCDate());
  const previousEnd = new Date(Date.UTC(previousMonthEnd.getUTCFullYear(), previousMonthEnd.getUTCMonth(), previousDay, 12));
  return { start: formatDate(previousMonthStart), end: formatDate(previousEnd) };
}

function periodRange(asOf, days) {
  const start = addDays(asOf, -(days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  return {
    current: { start, end: asOf },
    previous: { start: previousStart, end: previousEnd }
  };
}

function todayInTimeZone(timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function normalizeActionName(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("hu-HU");
}

function toNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function inRange(date, start, end) {
  return date >= start && date <= end;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const details = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${details?.slice(0, 1200)}`);
  }

  return payload;
}

async function supabase(path, options = {}) {
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...options.headers
  };
  return fetchJson(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
}

async function getGoogleSettings() {
  const query = new URLSearchParams({
    select: "project_id,provider,external_account_id,external_account_name,primary_conversion_name",
    provider: "eq.google_ads",
    is_enabled: "eq.true"
  });
  const rows = await supabase(`project_platform_settings?${query.toString()}`);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No enabled Google Ads project_platform_settings rows found.");
  }

  for (const row of rows) {
    if (!row.external_account_id || !row.primary_conversion_name) {
      throw new Error(`Missing account ID or primary conversion for project ${row.project_id}`);
    }
  }

  return rows;
}

function extractWindsorRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  throw new Error("Unexpected Windsor.ai response shape.");
}

async function getWindsorRows(fields, dateFrom, dateTo) {
  const query = new URLSearchParams({
    api_key: WINDSOR_API_KEY,
    fields: fields.join(","),
    date_from: dateFrom,
    date_to: dateTo
  });
  const payload = await fetchJson(`${WINDSOR_BASE_URL}?${query.toString()}`, {
    headers: { "User-Agent": "Windsor/1.0" }
  });
  return extractWindsorRows(payload);
}

function buildAccountIndexes(settings, spendRows, conversionRows) {
  const relevantAccounts = new Set(settings.map((row) => String(row.external_account_id)));
  const actionByAccount = new Map(
    settings.map((row) => [String(row.external_account_id), normalizeActionName(row.primary_conversion_name)])
  );
  const spendByAccountDate = new Map();
  const conversionByAccountDate = new Map();
  const currencyByAccount = new Map();
  const seenPrimaryAction = new Set();

  for (const row of spendRows) {
    const accountId = String(row.account_id ?? "");
    if (!relevantAccounts.has(accountId) || !row.date) continue;
    const key = `${accountId}|${row.date}`;
    spendByAccountDate.set(key, (spendByAccountDate.get(key) ?? 0) + toNumber(row.spend));
    if (row.currency_code) currencyByAccount.set(accountId, String(row.currency_code));
  }

  for (const row of conversionRows) {
    const accountId = String(row.account_id ?? "");
    if (!relevantAccounts.has(accountId) || !row.date) continue;
    const expectedAction = actionByAccount.get(accountId);
    if (!expectedAction || normalizeActionName(row.conversion_action_name) !== expectedAction) continue;

    seenPrimaryAction.add(accountId);
    const key = `${accountId}|${row.date}`;
    const current = conversionByAccountDate.get(key) ?? { purchases: 0, revenue: 0 };
    current.purchases += toNumber(row.conversions);
    current.revenue += toNumber(row.conversions_value);
    conversionByAccountDate.set(key, current);
  }

  const missingActions = settings.filter((row) => !seenPrimaryAction.has(String(row.external_account_id)));
  if (missingActions.length > 0) {
    const names = missingActions
      .map((row) => `${row.external_account_name ?? row.external_account_id}: ${row.primary_conversion_name}`)
      .join(", ");
    throw new Error(`Primary conversion action not returned by Windsor.ai in the fetch window: ${names}`);
  }

  return { spendByAccountDate, conversionByAccountDate, currencyByAccount };
}

function sumPeriod(accountId, start, end, indexes) {
  let spend = 0;
  let revenue = 0;
  let purchases = 0;

  for (let date = start; date <= end; date = addDays(date, 1)) {
    const key = `${accountId}|${date}`;
    spend += indexes.spendByAccountDate.get(key) ?? 0;
    const conversions = indexes.conversionByAccountDate.get(key);
    if (conversions) {
      revenue += conversions.revenue;
      purchases += conversions.purchases;
    }
  }

  return { spend, revenue, purchases };
}

function buildSnapshot(setting, asOf, indexes) {
  const accountId = String(setting.external_account_id);
  const range7 = periodRange(asOf, 7);
  const range14 = periodRange(asOf, 14);
  const range30 = periodRange(asOf, 30);
  const mtd = { start: firstDayOfMonth(asOf), end: asOf };
  const previousMtd = previousMonthSameElapsedRange(asOf);

  const current7 = sumPeriod(accountId, range7.current.start, range7.current.end, indexes);
  const previous7 = sumPeriod(accountId, range7.previous.start, range7.previous.end, indexes);
  const current14 = sumPeriod(accountId, range14.current.start, range14.current.end, indexes);
  const previous14 = sumPeriod(accountId, range14.previous.start, range14.previous.end, indexes);
  const current30 = sumPeriod(accountId, range30.current.start, range30.current.end, indexes);
  const previous30 = sumPeriod(accountId, range30.previous.start, range30.previous.end, indexes);
  const currentMtd = sumPeriod(accountId, mtd.start, mtd.end, indexes);
  const previousMtdValues = sumPeriod(accountId, previousMtd.start, previousMtd.end, indexes);

  return {
    project_id: setting.project_id,
    provider: "google_ads",
    external_account_id: accountId,
    as_of_date: asOf,
    currency_code: indexes.currencyByAccount.get(accountId) ?? "HUF",
    spend_7: current7.spend,
    revenue_7: current7.revenue,
    purchases_7: current7.purchases,
    prev_spend_7: previous7.spend,
    prev_revenue_7: previous7.revenue,
    prev_purchases_7: previous7.purchases,
    spend_14: current14.spend,
    revenue_14: current14.revenue,
    purchases_14: current14.purchases,
    prev_spend_14: previous14.spend,
    prev_revenue_14: previous14.revenue,
    prev_purchases_14: previous14.purchases,
    spend_30: current30.spend,
    revenue_30: current30.revenue,
    purchases_30: current30.purchases,
    prev_spend_30: previous30.spend,
    prev_revenue_30: previous30.revenue,
    prev_purchases_30: previous30.purchases,
    mtd_spend: currentMtd.spend,
    mtd_revenue: currentMtd.revenue,
    mtd_purchases: currentMtd.purchases,
    prev_mtd_spend: previousMtdValues.spend,
    prev_mtd_revenue: previousMtdValues.revenue,
    prev_mtd_purchases: previousMtdValues.purchases,
    source: "windsor_api",
    fetched_at: new Date().toISOString()
  };
}

async function writeSnapshots(snapshots) {
  const query = new URLSearchParams({
    on_conflict: "project_id,provider,as_of_date"
  });
  await supabase(`ppc_dashboard_snapshots?${query.toString()}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(snapshots)
  });
}

async function writeSyncRuns(settings, status, metadata, errorMessage = null) {
  const now = new Date().toISOString();
  const rows = settings.map((setting) => ({
    project_id: setting.project_id,
    integration_id: null,
    sync_type: "ppc_google_ads_daily",
    status,
    started_at: now,
    completed_at: now,
    records_processed: status === "success" ? BACKFILL_DAYS : 0,
    error_message: errorMessage ? String(errorMessage).slice(0, 4000) : null,
    metadata
  }));

  await supabase("sync_runs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows)
  });
}

async function updateIntegrationState(settings, status, errorMessage = null) {
  const now = new Date().toISOString();
  for (const setting of settings) {
    const query = new URLSearchParams({
      project_id: `eq.${setting.project_id}`,
      provider: "eq.google_ads"
    });
    const body = status === "connected"
      ? {
          status: "connected",
          last_successful_sync_at: now,
          last_sync_attempt_at: now,
          last_error: null
        }
      : {
          status: "error",
          last_sync_attempt_at: now,
          last_error: String(errorMessage ?? "Unknown sync error").slice(0, 4000)
        };

    await supabase(`integrations?${query.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(body)
    });
  }
}

async function main() {
  const settings = await getGoogleSettings();
  const asOf = process.env.PPC_AS_OF_DATE ?? addDays(todayInTimeZone(TIME_ZONE), -1);
  const earliestAsOf = addDays(asOf, -(BACKFILL_DAYS - 1));
  const fetchFrom = addDays(earliestAsOf, -70);
  const accountIds = new Set(settings.map((row) => String(row.external_account_id)));

  console.log(`Google Ads PPC sync: ${settings.length} accounts, as-of ${asOf}, backfill ${BACKFILL_DAYS} days.`);
  console.log(`Windsor.ai fetch window: ${fetchFrom} -> ${asOf}`);

  try {
    const [spendRowsRaw, conversionRowsRaw] = await Promise.all([
      getWindsorRows(["date", "account_id", "account_name", "spend", "currency_code"], fetchFrom, asOf),
      getWindsorRows(["date", "account_id", "conversion_action_name", "conversions", "conversions_value"], fetchFrom, asOf)
    ]);

    const spendRows = spendRowsRaw.filter((row) => accountIds.has(String(row.account_id ?? "")));
    const conversionRows = conversionRowsRaw.filter((row) => accountIds.has(String(row.account_id ?? "")));
    const indexes = buildAccountIndexes(settings, spendRows, conversionRows);
    const snapshots = [];

    for (let offset = BACKFILL_DAYS - 1; offset >= 0; offset -= 1) {
      const snapshotDate = addDays(asOf, -offset);
      for (const setting of settings) {
        snapshots.push(buildSnapshot(setting, snapshotDate, indexes));
      }
    }

    await writeSnapshots(snapshots);
    const metadata = {
      provider: "google_ads",
      source: "windsor_api",
      as_of_date: asOf,
      backfill_days: BACKFILL_DAYS,
      snapshots_written: snapshots.length,
      fetch_from: fetchFrom,
      fetch_to: asOf
    };
    await writeSyncRuns(settings, "success", metadata);
    await updateIntegrationState(settings, "connected");

    console.log(`PPC sync complete. ${snapshots.length} snapshots written.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    const metadata = {
      provider: "google_ads",
      source: "windsor_api",
      as_of_date: asOf,
      backfill_days: BACKFILL_DAYS,
      fetch_from: fetchFrom,
      fetch_to: asOf
    };

    try {
      await writeSyncRuns(settings, "failed", metadata, message);
      await updateIntegrationState(settings, "error", message);
    } catch (loggingError) {
      console.error("Failed to persist sync failure state:", loggingError);
    }

    process.exitCode = 1;
  }
}

await main();
