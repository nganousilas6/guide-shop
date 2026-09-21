import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
    // The build container constrains the process/thread pool; a single fork
    // avoids tinypool's min/max thread conflict and keeps the run deterministic.
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true, minForks: 1, maxForks: 1 },
    },
  },
});
