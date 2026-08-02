import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: "react-jsx"
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
      "server-only": new URL("./tests/fixtures/server-only-empty.ts", import.meta.url)
        .pathname
    }
  },
  test: {
    environment: "node"
  }
});
