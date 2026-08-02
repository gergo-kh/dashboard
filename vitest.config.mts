import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: "react-jsx"
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  },
  test: {
    environment: "node"
  }
});
