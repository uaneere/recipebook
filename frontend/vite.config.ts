import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["src/**/*.{test,spec}.ts", "src/**/*.{test,spec}.tsx"],
    globals: true,
    environment: "jsdom"
  }
});