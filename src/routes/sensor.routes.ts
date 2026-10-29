import { Router } from "express";
import { 
  getAllSensors, 
  getSensorById, 
  createSensor, 
  updateSensor, 
  deleteSensor 
} from "../controllers/sensor.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validateBody, validateObjectId } from "../middlewares/validate.middleware.js";
import { sensorSchema, updateSensorSchema } from "../schemas/sensor.schema.js"; // El esquema Zod que creamos antes

const router = Router();

// 1. Listar catálogo: Solo autenticado
router.get("/", authenticateToken, getAllSensors);

// 2. Obtener sensor por ID: Requiere token + validar que el :id es un ObjectId válido de MongoDB
router.get("/:id", authenticateToken, validateObjectId("id"), getSensorById);

// 3. Crear sensor: Token + Admin + Validar el body con Zod
router.post("/", authenticateToken, authorizeRoles("administrador"), validateBody(sensorSchema), createSensor);

// 4. Modificar sensor: Token + Admin + Validar ID + Validar body
router.patch("/:id", authenticateToken, authorizeRoles("administrador"), validateObjectId("id"), validateBody(updateSensorSchema), updateSensor);

// 5. Eliminar sensor: Token + Admin + Validar ID
router.delete("/:id", authenticateToken, authorizeRoles("administrador"), validateObjectId("id"), deleteSensor);


export default router;

