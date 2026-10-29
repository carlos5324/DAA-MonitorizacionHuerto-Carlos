// tests/integration/auth.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { userModel } from "../../src/models/user.model.js";
import { startTestDB, stopTestDB, clearDB, PASSWORD } from "./helpers.js";

describe("Suite de Integración: Autenticación", () => {
  beforeAll(startTestDB); // una vez, al empezar el fichero
  afterAll(stopTestDB); // una vez, al terminar
  beforeEach(clearDB); // antes de CADA test: base de datos vacía

  const nuevoUsuario = {
    email: "ana@example.com",
    password: PASSWORD,
    fullName: "Ana Pérez",
  };

  describe("POST /api/auth/register", () => {
    it("debe registrar un usuario con rol 'usuario' y responder con 201 Created", async () => {
      const response = await request(app).post("/api/auth/register").send(nuevoUsuario);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.token).toEqual(expect.any(String));
      expect(response.body.data.user).toEqual({
        id: expect.any(String),
        email: "ana@example.com",
        fullName: "Ana Pérez",
        role: "usuario",
      });
      expect(JSON.stringify(response.body)).not.toContain("password");
    });

    it("debe guardar la contraseña cifrada (bcrypt), nunca en texto plano", async () => {
      await request(app).post("/api/auth/register").send(nuevoUsuario);

      const guardado = await userModel.findOne({ email: nuevoUsuario.email }).select("+password");

      expect(guardado?.password).not.toBe(PASSWORD);
      expect(guardado?.password.startsWith("$2")).toBe(true); // prefijo de los hashes bcrypt
    });

    it("debe rechazar con 400 Bad Request datos inválidos y explicar qué campo falla", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ email: "email-mal", password: "123", fullName: "" });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("fail");
      expect(response.body.error).toBe("ValidationError");
      expect(response.body.details.length).toBeGreaterThan(0);
      expect(response.body.details[0]).toHaveProperty("field");
      expect(response.body.details[0]).toHaveProperty("message");
    });

    it("debe rechazar con 400 Bad Request si el cliente intenta elegir su rol", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...nuevoUsuario, role: "administrador" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("ValidationError");
    });

    it("debe rechazar con 409 Conflict un email ya registrado", async () => {
      await request(app).post("/api/auth/register").send(nuevoUsuario);
      const response = await request(app).post("/api/auth/register").send(nuevoUsuario);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("EmailAlreadyRegistered");
    });
  });

  describe("POST /api/auth/login", () => {
    it("debe responder con 200 OK y un token ante credenciales correctas", async () => {
      await request(app).post("/api/auth/register").send(nuevoUsuario);

      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: nuevoUsuario.email, password: PASSWORD });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toEqual(expect.any(String));
      expect(response.body.data.user.email).toBe("ana@example.com");
    });

    it("debe rechazar con 401 Unauthorized una contraseña incorrecta", async () => {
      await request(app).post("/api/auth/register").send(nuevoUsuario);

      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: nuevoUsuario.email, password: "OtraPassword999" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("InvalidCredentials");
    });

    it("debe responder igual con un email inexistente que con una contraseña mala", async () => {
      await request(app).post("/api/auth/register").send(nuevoUsuario);

      const emailMalo = await request(app)
        .post("/api/auth/login")
        .send({ email: "nadie@example.com", password: PASSWORD });
      const passwordMala = await request(app)
        .post("/api/auth/login")
        .send({ email: nuevoUsuario.email, password: "OtraPassword999" });

      expect(emailMalo.status).toBe(401);
      expect(emailMalo.body.message).toBe(passwordMala.body.message); // no revela qué dato falló
    });
  });

  describe("Acceso a rutas protegidas", () => {
    it("debe rechazar con 401 Unauthorized una petición sin token", async () => {
      const response = await request(app).get("/api/sensores");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("debe rechazar con 401 Unauthorized un token manipulado", async () => {
      const response = await request(app)
        .get("/api/sensores")
        .set("Authorization", "Bearer token-falso");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("InvalidToken");
    });
  });
});