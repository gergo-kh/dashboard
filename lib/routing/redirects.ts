const defaultFallback = "/";
const controlCharacterPattern = /[\u0000-\u001f\u007f]/;

function startsWithExactlyOneSlash(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

function isSafeInternalPath(value: string) {
  if (!startsWithExactlyOneSlash(value)) {
    return false;
  }

  if (value.includes("\\") || controlCharacterPattern.test(value)) {
    return false;
  }

  return true;
}

export function sanitizeInternalRedirectPath(
  value: string | null | undefined,
  fallback = defaultFallback
) {
  const safeFallback = isSafeInternalPath(fallback) ? fallback : defaultFallback;

  if (!value) {
    return safeFallback;
  }

  const candidate = value.trim();

  if (!isSafeInternalPath(candidate)) {
    return safeFallback;
  }

  let decoded = candidate;

  for (let index = 0; index < 2; index += 1) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      return safeFallback;
    }

    if (!isSafeInternalPath(decoded)) {
      return safeFallback;
    }
  }

  return candidate;
}
