import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      JWT_SECRET: "secreto-de-pruebas",
      JWT_EXPIRA: "1h",
      MONGODB_CNX: "mongodb://127.0.0.1:27099/app-usuarios-test",
    },
    setupFiles: ["tests/setup.js"],
    // Un solo servidor de MongoDB en memoria, compartido por todos los archivos.
    globalSetup: ["tests/global-setup.js"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["app.js", "controllers/**", "middlewares/**", "helpers/**", "models/**", "routes/**"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
