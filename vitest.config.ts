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
    // Un fichero de test cada vez: cada uno arranca su propia base de datos en memoria.
    fileParallelism: false,

    // src/config/env.ts exige estas variables al importarse. Se definen aquí con valores
    // de prueba para que los tests no dependan de tu .env real.
    // MONGODB_URI no se usa: los tests se conectan a una base de datos en memoria.
    env: {
      NODE_ENV: "test",
      PORT: "3999",
      JWT_SECRET: "secreto-solo-para-tests",
      JWT_EXPIRES_IN: "1h",
      MONGODB_URI: "mongodb://127.0.0.1:27017/placeholder",
    },
  },
});