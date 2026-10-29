import { AppError } from "./app.error.js";

export class UnauthorizedError extends AppError {
  constructor(message: string = "Se requiere cabecera 'Authorization: Bearer <token>'.") {
    super(message, 401);
    this.name = "Unauthorized";
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super("Token inválido o expirado.", 401);
    this.name = "InvalidToken";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Credenciales inválidas", 401);
    this.name = "InvalidCredentials";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "No dispone de privilegios suficientes para ejecutar esta acción.") {
    super(message, 403);
    this.name = "Forbidden";
  }
}

export class EmailAlreadyRegisteredError extends AppError {
  constructor() {
    super("El correo electrónico ya está registrado", 409);
    this.name = "EmailAlreadyRegistered";
  }
}
