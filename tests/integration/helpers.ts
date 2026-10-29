// tests/integration/helpers.ts
// Funciones de apoyo para los tests. No termina en .test.ts, así que Vitest no lo ejecuta como test.

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { app } from "../../src/app.js";
import { userModel } from "../../src/models/user.model.js";

let mongoServer: MongoMemoryServer;

export const PASSWORD = "Password123";

/** Tiene formato de ObjectId válido, pero no existe en la base de datos. */
export const ID_INEXISTENTE = "64b7f0f0f0f0f0f0f0f0f0f0";

// ---------------------------------------------------------------------------
// Base de datos en memoria: no toca tu MongoDB Atlas.
// ---------------------------------------------------------------------------

/** Arranca un MongoDB temporal y conecta Mongoose a él. Se llama en beforeAll. */
export async function startTestDB(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await userModel.init(); // asegura que el índice único del email está creado
}

/** Desconecta y apaga el MongoDB temporal. Se llama en afterAll. */
export async function stopTestDB(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
}

/** Vacía todas las colecciones. Se llama en beforeEach para que cada test parta de cero. */
export async function clearDB(): Promise<void> {
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
}

// ---------------------------------------------------------------------------
// Usuarios y tokens
// ---------------------------------------------------------------------------

/** Cabecera Authorization lista para usar con supertest: .set(bearer(token)) */
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/**
 * Registra un usuario por la API y devuelve su token.
 * Para un administrador hace lo mismo que se hace a mano en Atlas:
 * cambia el rol en la base de datos y vuelve a hacer login (el rol viaja dentro del token).
 */
export async function registerAndLogin(
  email: string,
  role: "usuario" | "administrador"
): Promise<string> {
  await request(app)
    .post("/api/auth/register")
    .send({ email, password: PASSWORD, fullName: "Usuario de prueba" });

  if (role === "administrador") {
    await userModel.updateOne({ email }, { role: "administrador" });
  }

  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  return res.body.data.token as string;
}

// ---------------------------------------------------------------------------
// Sensores
// ---------------------------------------------------------------------------

/** Cuerpo válido para crear un sensor; se puede sobrescribir cualquier campo. */
export const sensorBody = (overrides: Record<string, unknown> = {}) => ({
  nombre: "Humedad invernadero",
  tipo: "humedad",
  unidad: "%",
  ubicacion: "Invernadero",
  activo: true,
  valorLimite: 80,
  ...overrides,
});

/** Crea un sensor como administrador y devuelve su _id. */
export async function createSensor(
  adminToken: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const res = await request(app)
    .post("/api/sensores")
    .set(bearer(adminToken))
    .send(sensorBody(overrides));
  return res.body.data._id as string;
}