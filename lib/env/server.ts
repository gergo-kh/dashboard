import "server-only";
import { z } from "zod";

const serverIntegrationEnvSchema = z
  .object({
    WINDSOR_API_KEY: z.string().min(1, "WINDSOR_API_KEY is required."),
    WINDSOR_API_BASE_URL: z.string().url("WINDSOR_API_BASE_URL must be a valid URL."),
    NODE_ENV: z.enum(["development", "test", "production"]).optional()
  })
  .superRefine((env, context) => {
    const url = new URL(env.WINDSOR_API_BASE_URL);

    if (env.NODE_ENV !== "test" && url.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message: "WINDSOR_API_BASE_URL must use HTTPS outside test environments.",
        path: ["WINDSOR_API_BASE_URL"]
      });
    }
  });

export type ServerIntegrationEnv = z.infer<typeof serverIntegrationEnvSchema>;

export function getServerIntegrationEnv(
  source: NodeJS.ProcessEnv = process.env
): ServerIntegrationEnv {
  const parsed = serverIntegrationEnvSchema.safeParse({
    WINDSOR_API_KEY: source.WINDSOR_API_KEY,
    WINDSOR_API_BASE_URL: source.WINDSOR_API_BASE_URL,
    NODE_ENV: source.NODE_ENV
  });

  if (!parsed.success) {
    throw new Error(
      "Missing or invalid server integration environment variables. Configure WINDSOR_API_KEY and WINDSOR_API_BASE_URL."
    );
  }

  return parsed.data;
}
