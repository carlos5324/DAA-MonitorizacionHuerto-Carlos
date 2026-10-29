import { z } from "zod";
import { MAGNITUDES_SENSOR } from "../types/huerto.types.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "El ID del sensor no es válido");

export const createLecturaSchema = z.object({
  sensorId: objectIdSchema,
  valor: z.number({
    required_error: "El valor debe ser un número y es obligatorio",
  }),
  unidad: z
    .string({ required_error: "La unidad es obligatoria" })
    .trim()
    .min(1, "La unidad no puede estar vacía"),
    tiempo: z.coerce.date().optional(),
}).strict();

export const getLecturasQuerySchema = z.object({
  pagina: z.coerce
    .number()
    .int("La página debe ser un número entero")
    .min(1, "La página mínima es 1")
    .default(1),
  limite: z.coerce
    .number()
    .int("El límite debe ser un número entero")
    .min(1, "El límite mínimo es 1")
    .max(100, "El límite máximo es 100")
    .default(20),
  sensorId: objectIdSchema.optional(),
  tipo: z.enum(MAGNITUDES_SENSOR, {
    message: "Tipo de magnitud no válido",
  }).optional(),
  anomala: z
  .enum(["true", "false"])
  .transform((val) => val === "true")
  .optional(),
  orden: z
    .enum(["tiempo", "-tiempo", "valor", "-valor"], {
      message: "Criterio de ordenación no válido",
    })
    .optional(),
}).strict();

export type CreateLecturaInput = z.infer<typeof createLecturaSchema>;
export type GetLecturasQueryInput = z.infer<typeof getLecturasQuerySchema>;