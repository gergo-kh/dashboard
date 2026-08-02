import "server-only";
import { IntegrationError } from "@/lib/integrations/errors";
import { windsorDailyMetricsResponseSchema } from "@/lib/integrations/windsor/schemas";
import type {
  WindsorClient,
  WindsorDailyMetricsRequest,
  WindsorFetch
} from "@/lib/integrations/windsor/types";

export type WindsorClientConfig = Readonly<{
  apiKey: string;
  baseUrl: string;
  timeoutMs?: number;
  fetcher?: WindsorFetch;
  dailyMetricsPath?: string;
}>;

export function createWindsorClient(config: WindsorClientConfig): WindsorClient {
  return new HttpWindsorClient(config);
}

class HttpWindsorClient implements WindsorClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: WindsorFetch;
  private readonly dailyMetricsPath: string;

  constructor(config: WindsorClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.fetcher = config.fetcher ?? fetch;
    this.dailyMetricsPath = config.dailyMetricsPath ?? "/v1/daily-metrics";
  }

  async fetchDailyMetrics(input: WindsorDailyMetricsRequest) {
    const response = await this.requestWithRetry(input);
    const body = await response.json();
    const parsed = windsorDailyMetricsResponseSchema.safeParse(body);

    if (!parsed.success) {
      throw new IntegrationError({
        code: "invalid_response",
        message: "Windsor returned a response that did not match the adapter contract.",
        safeDetails: { requestStatus: response.status }
      });
    }

    return parsed.data;
  }

  private async requestWithRetry(input: WindsorDailyMetricsRequest): Promise<Response> {
    const attempts = 3;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const response = await this.requestOnce(input);

      if (response.ok) {
        return response;
      }

      if (response.status === 401 || response.status === 403) {
        throw new IntegrationError({
          code: "authentication_error",
          message: "Windsor authentication failed.",
          safeDetails: { requestStatus: response.status }
        });
      }

      if (response.status === 429) {
        if (attempt < attempts) {
          continue;
        }

        throw new IntegrationError({
          code: "rate_limited",
          message: "Windsor rate limit was reached.",
          retryable: true,
          safeDetails: { requestStatus: response.status }
        });
      }

      if (response.status >= 500) {
        if (attempt < attempts) {
          continue;
        }

        throw new IntegrationError({
          code: "provider_unavailable",
          message: "Windsor provider is unavailable.",
          retryable: true,
          safeDetails: { requestStatus: response.status }
        });
      }

      throw new IntegrationError({
        code: "invalid_response",
        message: "Windsor rejected the daily metrics request.",
        safeDetails: { requestStatus: response.status }
      });
    }

    throw new IntegrationError({
      code: "provider_unavailable",
      message: "Windsor request failed after retries.",
      retryable: true
    });
  }

  private async requestOnce(input: WindsorDailyMetricsRequest): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const url = new URL(this.dailyMetricsPath, this.baseUrl);

    try {
      return await this.fetcher(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(input),
        signal: controller.signal
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new IntegrationError({
          code: "provider_unavailable",
          message: "Windsor request timed out.",
          retryable: true
        });
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
