import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { setupFiles: ["./tests/setup.ts"], exclude: ["node_modules/**", "dist/**"], testTimeout: 15000 },
});
