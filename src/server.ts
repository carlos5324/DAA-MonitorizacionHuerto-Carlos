import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/database.js";

async function bootstrap() {
  await connectDB();

  const server = app.listen(env.port, (error?: Error) => {
    if (error) {
      console.error("No se pudo abrir el puerto:", error);
      process.exit(1);
    }
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error("No se pudo arrancar el servidor:", error);
  process.exit(1);
});