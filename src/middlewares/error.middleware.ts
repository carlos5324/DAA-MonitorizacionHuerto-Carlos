import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app.error.js";

import mongoose from "mongoose";
import { env } from "../config/env.js";


export const notFoundHandler = (req: Request, res: Response) => { // manejador rutas no encontradas
  res.status(404).json({
    status: "fail",
    error: "NotFound",
    message: `Ruta inexistente: ${req.method} ${req.originalUrl}` //cuando no existe una ruta
  });
};

export const globalErrorHandler = ( // manejador global de errores
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    const issues = err.issues.map(issue => ({
      field: issue.path.map(String).join("."),
      message: issue.message
    }));

    return res.status(400).json({
      status: "fail",
      error: "ValidationError",
      message: "Los datos de la petición no satisfacen el contrato de validación.",
      details: issues
    });
  }

  // JSON mal formado: express.json() lanza un SyntaxError con status 400. Sin
  // este caso caería en el 500 genérico de abajo (es un error del CLIENTE).
  if (err instanceof SyntaxError && (err as any).type === "entity.parse.failed") {
    return res.status(400).json({
      status: "fail",
      error: "InvalidJSON",
      message: "El cuerpo de la petición no es un JSON válido."
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.statusCode >= 500 ? "error" : "fail",
      error: err.name,
      message: err.message
    });
  }

    if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      status: "fail",
      error: "DatabaseValidationError",
      message: "Los datos no cumplen las reglas del modelo.",
      details: Object.values(err.errors).map(e => ({ field: e.path, message: e.message }))
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      status: "fail",
      error: "InvalidValue",
      message: `Valor no válido para el campo '${err.path}'.`
    });
  }

  if ((err as any).code === 11000) {
    const fields = Object.keys((err as any).keyValue ?? {}).join(", ");
    return res.status(409).json({
      status: "fail",
      error: "DuplicateKey",
      message: `Ya existe un registro con ese valor (${fields}).`
    });
  }

    // Errores del cliente generados por Express o body-parser (p. ej. cuerpo demasiado grande → 413)
  const httpStatus = (err as any).status ?? (err as any).statusCode;
  if (typeof httpStatus === "number" && httpStatus >= 400 && httpStatus < 500) {
    return res.status(httpStatus).json({
      status: "fail",
      error: err.name,
      message: err.message
    });
  }

  console.error("Excepción no controlada:", err);

  return res.status(500).json({
    status: "error",
    error: "InternalServerError",
    message: "Ha ocurrido un error inesperado en el servidor.",
    ...(env.nodeEnv === "development" && { stack: err.stack })
  });
};

