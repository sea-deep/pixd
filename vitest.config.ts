import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["node_modules/**", "dist/**", "shipready_results/**"],
    setupFiles: ["./tests/setup.ts"],
  },
});
