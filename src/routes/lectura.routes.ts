import { Router } from "express";
import { createLectura, getLecturas } from "../controllers/lectura.controller.js";
import { validateBody, validateQuery } from "../middlewares/validate.middleware.js";
import { createLecturaSchema, getLecturasQuerySchema } from "../schemas/lectura.schema.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";


const router = Router();

router.use(authenticateToken);


// POST / - Crear una nueva lectura (valida el body)
router.post("/", validateBody(createLecturaSchema), createLectura);

// GET / - Listar y consultar lecturas con filtros y paginación (valida los query params)
router.get("/", validateQuery(getLecturasQuerySchema), getLecturas);

export default router;