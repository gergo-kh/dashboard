import { assertServerOnlyModule } from "@/lib/server-only";

assertServerOnlyModule("Integration errors");

export type IntegrationErrorCode =
  | "configuration_error"
  | "authentication_error"
  | "rate_limited"
  | "provider_unavailable"
  | "invalid_response"
  | "mapping_error"
  | "persistence_error"
  | "sync_conflict";

export type SafeErrorDetails = Readonly<Record<string, string | number | boolean>>;

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly safeDetails: SafeErrorDetails;
  readonly retryable: boolean;

  constructor(input: {
    code: IntegrationErrorCode;
    message: string;
    retryable?: boolean;
    safeDetails?: SafeErrorDetails;
  }) {
    super(redactSensitiveText(input.message));
    this.name = "IntegrationError";
    this.code = input.code;
    this.safeDetails = input.safeDetails ?? {};
    this.retryable = input.retryable ?? false;
  }
}

const sensitivePatterns = [
  /bearer\s+[a-z0-9._~+/=-]+/gi,
  /api[_-]?key[=:]\s*[a-z0-9._~+/=-]+/gi,
  /token[=:]\s*[a-z0-9._~+/=-]+/gi,
  /secret[=:]\s*[a-z0-9._~+/=-]+/gi
];

export function redactSensitiveText(value: string): string {
  return sensitivePatterns.reduce(
    (current, pattern) => current.replace(pattern, "[redacted]"),
    value
  );
}

export function toIntegrationError(error: unknown): IntegrationError {
  if (error instanceof IntegrationError) {
    return error;
  }

  if (error instanceof Error) {
    return new IntegrationError({
      code: "provider_unavailable",
      message: error.message,
      retryable: true
    });
  }

  return new IntegrationError({
    code: "provider_unavailable",
    message: "Unknown integration failure.",
    retryable: true
  });
}
