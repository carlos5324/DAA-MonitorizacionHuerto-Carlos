import { Router } from "express";
import { createLectura, getLecturas } from "../controllers/lectura.controller.js";
import { validateBody, validateQuery } from "../middlewares/validate.middleware.js";
import { createLecturaSchema, getLecturasQuerySchema } from "../schemas/lectura.schema.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";


const router = Router();

router.use(authenticateToken);


// POST
router.post("/", validateBody(createLecturaSchema), createLectura);

// GET
router.get("/", validateQuery(getLecturasQuerySchema), getLecturas);

export default router;