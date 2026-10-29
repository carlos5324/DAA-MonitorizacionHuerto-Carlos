import { z } from "zod";
import { MAGNITUDES_SENSOR } from "../types/huerto.types.js";

export const sensorSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  tipo: z.enum(MAGNITUDES_SENSOR),
  unidad: z.string().trim().min(1, "La unidad es obligatoria"),
  ubicacion: z.string().trim().min(1, "La ubicación es obligatoria"),
  activo: z.boolean(),
  valorLimite: z.number({ required_error: "El valor límite es obligatorio" }),
}).strict();

export const updateSensorSchema = sensorSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes indicar al menos un campo para actualizar",
  });

export type SensorInput = z.infer<typeof sensorSchema>;
export type UpdateSensorInput = z.infer<typeof updateSensorSchema>;