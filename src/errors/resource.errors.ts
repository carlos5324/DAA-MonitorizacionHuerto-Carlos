import { AppError } from "./app.error.js";



export class SensorNotFoundError extends AppError {
  constructor(sensorId: string) {
    super(`El sensor con ID '${sensorId}' no existe en el sistema.`, 404);
    this.name = "SensorNotFound";
  }
}

export class InvalidIdError extends AppError {
  constructor(paramName: string, value: string) {
    super(`El parámetro '${paramName}' con valor '${value}' no es un identificador válido.`, 400);
    this.name = "InvalidId";
  }
}

export class InactiveSensorError extends AppError {
  constructor(sensorId: string) {
    super(`El sensor '${sensorId}' está inactivo y no admite nuevas lecturas.`, 422);
    this.name = "InactiveSensor";
  }
}

export class SensorInUseError extends AppError {
  constructor(sensorId: string) {
    super(`El sensor '${sensorId}' tiene lecturas asociadas y no se puede eliminar. Desactívalo con activo: false.`, 409);
    this.name = "SensorInUse";
  }
}

