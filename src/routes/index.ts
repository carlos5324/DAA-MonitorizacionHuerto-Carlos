import { Router } from "express";
import authRoutes from "./auth.routes.js";
import sensorRoutes from "./sensor.routes.js";
import lecturaRoutes from "./lectura.routes.js";

const router = Router();

router.use("/lecturas", lecturaRoutes);
router.use("/auth", authRoutes);
router.use("/sensores", sensorRoutes);

export default router;