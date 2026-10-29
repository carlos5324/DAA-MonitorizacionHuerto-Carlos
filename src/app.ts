import express, { Request, Response } from "express";
import router from "./routes/index.js";
import { notFoundHandler, globalErrorHandler } from "./middlewares/error.middleware.js";

import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi.js";

export const app = express();
app.disable("x-powered-by");

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.use("/api", router);

app.use(notFoundHandler);
app.use(globalErrorHandler);

