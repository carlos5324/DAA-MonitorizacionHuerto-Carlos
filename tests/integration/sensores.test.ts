// tests/integration/sensores.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import {
  startTestDB,
  stopTestDB,
  clearDB,
  registerAndLogin,
  bearer,
  sensorBody,
  createSensor,
  ID_INEXISTENTE,
} from "./helpers.js";

describe("Suite de Integración: Sensores", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(startTestDB);
  afterAll(stopTestDB);

  // Antes de CADA test: base de datos vacía y dos usuarios nuevos (uno administrador, otro normal).
  beforeEach(async () => {
    await clearDB();
    adminToken = await registerAndLogin("admin@huerto.com", "administrador");
    userToken = await registerAndLogin("user@huerto.com", "usuario");
  });

  describe("GET /api/sensores", () => {
    it("debe rechazar con 401 Unauthorized si no hay token", async () => {
      const response = await request(app).get("/api/sensores");

      expect(response.status).toBe(401);
    });

    it("debe responder con 200 OK al listado para un usuario normal", async () => {
      await createSensor(adminToken);

      const response = await request(app).get("/api/sensores").set(bearer(userToken));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe("POST /api/sensores", () => {
    it("debe crear un sensor y responder con 201 Created si el usuario es administrador", async () => {
      const response = await request(app)
        .post("/api/sensores")
        .set(bearer(adminToken))
        .send(sensorBody());

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        nombre: "Humedad invernadero",
        tipo: "humedad",
        activo: true,
        valorLimite: 80,
      });
      expect(response.body.data).toHaveProperty("_id");
    });

    it("debe rechazar con 403 Forbidden si el usuario no es administrador", async () => {
      const response = await request(app)
        .post("/api/sensores")
        .set(bearer(userToken))
        .send(sensorBody());

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Forbidden");
    });

    it("debe rechazar con 400 Bad Request campos que no existen en el sensor", async () => {
      const response = await request(app)
        .post("/api/sensores")
        .set(bearer(adminToken))
        .send(sensorBody({ foo: 1 }));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("ValidationError");
    });

    it("debe rechazar con 400 Bad Request un tipo de magnitud desconocido", async () => {
      const response = await request(app)
        .post("/api/sensores")
        .set(bearer(adminToken))
        .send(sensorBody({ tipo: "viento" }));

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/sensores/:id", () => {
    it("debe responder con 200 OK y el detalle del sensor", async () => {
      const id = await createSensor(adminToken);

      const response = await request(app).get(`/api/sensores/${id}`).set(bearer(userToken));

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(id);
      expect(response.body.data.nombre).toBe("Humedad invernadero");
    });

    it("debe rechazar con 400 Bad Request un identificador mal formado", async () => {
      const response = await request(app).get("/api/sensores/abc").set(bearer(userToken));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("InvalidId");
    });

    it("debe responder con 404 Not Found si el sensor no existe", async () => {
      const response = await request(app)
        .get(`/api/sensores/${ID_INEXISTENTE}`)
        .set(bearer(userToken));

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("fail");
      expect(response.body.error).toBe("SensorNotFound");
    });
  });

  describe("PATCH /api/sensores/:id", () => {
    it("debe modificar solo los campos enviados y responder con 200 OK", async () => {
      const id = await createSensor(adminToken);

      const response = await request(app)
        .patch(`/api/sensores/${id}`)
        .set(bearer(adminToken))
        .send({ valorLimite: 90 });

      expect(response.status).toBe(200);
      expect(response.body.data.valorLimite).toBe(90);
      expect(response.body.data.nombre).toBe("Humedad invernadero"); // lo demás no cambia
    });

    it("debe rechazar con 403 Forbidden si el usuario no es administrador", async () => {
      const id = await createSensor(adminToken);

      const response = await request(app)
        .patch(`/api/sensores/${id}`)
        .set(bearer(userToken))
        .send({ valorLimite: 99 });

      expect(response.status).toBe(403);
    });

    it("debe rechazar con 400 Bad Request una modificación sin ningún campo", async () => {
      const id = await createSensor(adminToken);

      const response = await request(app)
        .patch(`/api/sensores/${id}`)
        .set(bearer(adminToken))
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/sensores/:id", () => {
    it("debe eliminar el sensor y responder con 204 No Content si el usuario es administrador", async () => {
      const id = await createSensor(adminToken);

      const response = await request(app).delete(`/api/sensores/${id}`).set(bearer(adminToken));

      expect(response.status).toBe(204);
    });

    it("debe rechazar con 403 Forbidden si el usuario no es administrador", async () => {
      const id = await createSensor(adminToken);

      const response = await request(app).delete(`/api/sensores/${id}`).set(bearer(userToken));

      expect(response.status).toBe(403);
    });
  });

  describe("Ciclo de vida completo de un sensor", () => {
    it("debe crear, consultar, modificar y eliminar un sensor, y después responder 404", async () => {
      // 1. Crear (201)
      const creado = await request(app)
        .post("/api/sensores")
        .set(bearer(adminToken))
        .send(sensorBody());
      expect(creado.status).toBe(201);
      const id = creado.body.data._id as string;

      // 2. Consultar (200)
      const consultado = await request(app).get(`/api/sensores/${id}`).set(bearer(adminToken));
      expect(consultado.status).toBe(200);
      expect(consultado.body.data.nombre).toBe("Humedad invernadero");

      // 3. Modificar (200)
      const modificado = await request(app)
        .patch(`/api/sensores/${id}`)
        .set(bearer(adminToken))
        .send({ valorLimite: 90 });
      expect(modificado.status).toBe(200);
      expect(modificado.body.data.valorLimite).toBe(90);

      // 4. Eliminar (204)
      const eliminado = await request(app).delete(`/api/sensores/${id}`).set(bearer(adminToken));
      expect(eliminado.status).toBe(204);

      // 5. Ya no existe (404)
      const despues = await request(app).get(`/api/sensores/${id}`).set(bearer(adminToken));
      expect(despues.status).toBe(404);
      expect(despues.body.error).toBe("SensorNotFound");
    });
  });
});