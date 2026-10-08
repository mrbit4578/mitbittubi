import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    maxWorkers: 2,
    minWorkers: 1,
    testTimeout: 10000,
  },
});
