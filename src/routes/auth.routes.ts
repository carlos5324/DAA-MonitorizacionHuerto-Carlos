import { Router } from "express";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import { validateBody } from "../middlewares/validate.middleware.js"; 
import { register, login } from "../controllers/auth.controller.js";


const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);


export default router;
