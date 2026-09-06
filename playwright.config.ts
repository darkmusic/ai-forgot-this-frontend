import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/browser",
  outputDir: "../../target/frontend-browser-tests",
  use: {
    baseURL: "http://127.0.0.1:4179",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4179 --strictPort",
    url: "http://127.0.0.1:4179/test/browser/bulk-entry.html",
    env: { VITE_TOMCAT_SERVER_URL: "", VITE_PROXY_TARGET: "" },
  },
});
