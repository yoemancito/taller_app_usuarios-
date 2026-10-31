import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    testIdAttribute: "data-test",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run seed && npm run dev",
      cwd: "../api",
      port: 3000,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        MONGODB_CNX: "mongodb://127.0.0.1:27017/app-usuarios-e2e",
        JWT_SECRET: "secreto-e2e",
      },
    },
    {
      command: "npm run dev",
      port: 5173,
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
