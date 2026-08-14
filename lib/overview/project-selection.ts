export const overviewProjectQueryParam = "projectId";

type SearchParamValue = string | string[] | undefined;

export function getRequestedProjectIdFromSearchParams(
  searchParams: Record<string, SearchParamValue>
) {
  return sanitizeOverviewProjectId(getSingleSearchParam(searchParams[overviewProjectQueryParam]));
}

export function sanitizeOverviewProjectId(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed.length > 128) {
    return undefined;
  }

  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : undefined;
}

export function buildOverviewProjectHref(input: {
  pathname: string;
  searchParams: URLSearchParams;
  projectId: string;
}) {
  const params = new URLSearchParams(input.searchParams.toString());
  params.set(overviewProjectQueryParam, input.projectId);

  const query = params.toString();

  return query ? `${input.pathname}?${query}` : input.pathname;
}

function getSingleSearchParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}
