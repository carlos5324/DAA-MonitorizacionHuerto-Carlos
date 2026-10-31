// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 10000,

    // La primera vez, mongodb-memory-server descarga un binario de MongoDB y tarda.
    hookTimeout: 60000,

    // Solo son tests los ficheros *.test.ts dentro de tests/ (en la raíz del proyecto).
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,

    env: {
      NODE_ENV: "test",
      PORT: "3999",
      JWT_SECRET: "secreto-solo-para-tests",
      JWT_EXPIRES_IN: "1h",
      MONGODB_URI: "mongodb://127.0.0.1:27017/placeholder",
    },
  },
});