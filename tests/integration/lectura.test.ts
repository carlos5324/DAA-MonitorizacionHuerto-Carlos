// tests/integration/lecturas.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import {
  startTestDB,
  stopTestDB,
  clearDB,
  registerAndLogin,
  bearer,
  createSensor,
  ID_INEXISTENTE,
} from "./helpers.js";

describe("Suite de Integración: Lecturas", () => {
  let adminToken: string;
  let userToken: string;
  let sensorId: string; // sensor de humedad con valorLimite = 80

  beforeAll(startTestDB);
  afterAll(stopTestDB);

  beforeEach(async () => {
    await clearDB();
    adminToken = await registerAndLogin("admin@huerto.com", "administrador");
    userToken = await registerAndLogin("user@huerto.com", "usuario");
    sensorId = await createSensor(adminToken); // humedad, límite 80
  });

  /** Registra una lectura como usuario normal. */
  const postLectura = (body: Record<string, unknown>) =>
    request(app).post("/api/lecturas").set(bearer(userToken)).send(body);

  describe("POST /api/lecturas", () => {
    it("debe rechazar con 401 Unauthorized si no hay token", async () => {
      const response = await request(app)
        .post("/api/lecturas")
        .send({ sensorId, valor: 1, unidad: "%" });

      expect(response.status).toBe(401);
    });

    it("debe crear una lectura NO anómala si el valor está por debajo del límite", async () => {
      const response = await postLectura({ sensorId, valor: 50, unidad: "%" });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.esAnomala).toBe(false);
      expect(response.body.data.sensorId).toBe(sensorId); // referencia al sensor, no datos copiados
    });

    it("debe marcar como anómala una lectura que supera el límite del sensor", async () => {
      const response = await postLectura({ sensorId, valor: 95, unidad: "%" });

      expect(response.status).toBe(201);
      expect(response.body.data.esAnomala).toBe(true);
    });

    it("debe considerar normal una lectura exactamente igual al límite (regla: valor > límite)", async () => {
      const response = await postLectura({ sensorId, valor: 80, unidad: "%" });

      expect(response.status).toBe(201);
      expect(response.body.data.esAnomala).toBe(false);
    });

    it("debe rechazar con 400 Bad Request si el cliente intenta decidir esAnomala", async () => {
      const response = await postLectura({ sensorId, valor: 50, unidad: "%", esAnomala: true });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("ValidationError");
    });

    it("debe rechazar con 400 Bad Request un valor que no es un número", async () => {
      const response = await postLectura({ sensorId, valor: "alto", unidad: "%" });

      expect(response.status).toBe(400);
    });

    it("debe rechazar con 400 Bad Request un identificador de sensor mal formado", async () => {
      const response = await postLectura({ sensorId: "abc", valor: 50, unidad: "%" });

      expect(response.status).toBe(400);
    });

    it("debe responder con 404 Not Found si el sensor no existe", async () => {
      const response = await postLectura({ sensorId: ID_INEXISTENTE, valor: 50, unidad: "%" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("SensorNotFound");
    });

    it("debe rechazar con 422 Unprocessable Entity una lectura de un sensor inactivo", async () => {
      await request(app)
        .patch(`/api/sensores/${sensorId}`)
        .set(bearer(adminToken))
        .send({ activo: false });

      const response = await postLectura({ sensorId, valor: 50, unidad: "%" });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe("InactiveSensor");
    });
  });

  describe("GET /api/lecturas", () => {
    it("debe rechazar con 401 Unauthorized si no hay token", async () => {
      const response = await request(app).get("/api/lecturas");

      expect(response.status).toBe(401);
    });

    it("debe rechazar con 400 Bad Request parámetros de consulta inválidos", async () => {
      const limiteAlto = await request(app).get("/api/lecturas?limite=500").set(bearer(userToken));
      const ordenRaro = await request(app).get("/api/lecturas?orden=foo").set(bearer(userToken));
      const sensorRaro = await request(app).get("/api/lecturas?sensorId=abc").set(bearer(userToken));

      expect(limiteAlto.status).toBe(400);
      expect(ordenRaro.status).toBe(400);
      expect(sensorRaro.status).toBe(400);
    });

    describe("sobre un histórico de 6 lecturas (límite del sensor = 80)", () => {
      // Valores en orden cronológico: 50, 95, 60, 91, 70, 100  → anómalas: 95, 91, 100
      beforeEach(async () => {
        const valores = [50, 95, 60, 91, 70, 100];
        for (let i = 0; i < valores.length; i++) {
          await postLectura({
            sensorId,
            valor: valores[i],
            unidad: "%",
            tiempo: new Date(Date.UTC(2026, 0, 1, 10, i)).toISOString(),
          });
        }
      });

      const valoresDe = (response: request.Response) =>
        response.body.data.map((l: { valor: number }) => l.valor);

      it("debe paginar e informar de la página actual y del total de páginas", async () => {
        const response = await request(app)
          .get("/api/lecturas?pagina=1&limite=2")
          .set(bearer(userToken));

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.meta).toEqual({ page: 1, limit: 2, total: 6, totalPages: 3 });
      });

      it("debe devolver en la última página los elementos que sobran", async () => {
        const response = await request(app)
          .get("/api/lecturas?pagina=3&limite=2")
          .set(bearer(userToken));

        expect(response.body.data).toHaveLength(2);
        expect(response.body.meta.page).toBe(3);
      });

      it("debe filtrar solo las lecturas anómalas (anomala=true)", async () => {
        const response = await request(app).get("/api/lecturas?anomala=true").set(bearer(userToken));

        expect(response.body.meta.total).toBe(3);
        expect(response.body.data.every((l: { esAnomala: boolean }) => l.esAnomala)).toBe(true);
      });

      it("debe filtrar solo las lecturas normales (anomala=false)", async () => {
        const response = await request(app).get("/api/lecturas?anomala=false").set(bearer(userToken));

        expect(response.body.meta.total).toBe(3);
        expect(response.body.data.every((l: { esAnomala: boolean }) => !l.esAnomala)).toBe(true);
      });

      it("debe ordenar por fecha descendente por defecto", async () => {
        const response = await request(app).get("/api/lecturas").set(bearer(userToken));

        expect(valoresDe(response)).toEqual([100, 70, 91, 60, 95, 50]);
      });

      it("debe ordenar por valor ascendente (orden=valor)", async () => {
        const response = await request(app).get("/api/lecturas?orden=valor").set(bearer(userToken));

        expect(valoresDe(response)).toEqual([50, 60, 70, 91, 95, 100]);
      });

      it("debe COMBINAR filtro por tipo + anomalía + orden + paginación en una misma consulta", async () => {
        const pagina1 = await request(app)
          .get("/api/lecturas?tipo=humedad&anomala=true&orden=-valor&pagina=1&limite=2")
          .set(bearer(userToken));
        const pagina2 = await request(app)
          .get("/api/lecturas?tipo=humedad&anomala=true&orden=-valor&pagina=2&limite=2")
          .set(bearer(userToken));

        expect(pagina1.status).toBe(200);
        expect(valoresDe(pagina1)).toEqual([100, 95]);
        expect(pagina1.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
        expect(valoresDe(pagina2)).toEqual([91]);
      });

      it("debe filtrar por sensor de origen (sensorId)", async () => {
        const otroSensor = await createSensor(adminToken, {
          nombre: "Temperatura patio",
          tipo: "temperatura",
          unidad: "°C",
          valorLimite: 30,
        });
        await postLectura({ sensorId: otroSensor, valor: 35, unidad: "°C" });

        const delPrimero = await request(app)
          .get(`/api/lecturas?sensorId=${sensorId}`)
          .set(bearer(userToken));
        const delSegundo = await request(app)
          .get(`/api/lecturas?sensorId=${otroSensor}`)
          .set(bearer(userToken));

        expect(delPrimero.body.meta.total).toBe(6);
        expect(delSegundo.body.meta.total).toBe(1);
      });

      it("debe filtrar por tipo de magnitud del sensor (tipo)", async () => {
        const temperatura = await request(app)
          .get("/api/lecturas?tipo=temperatura")
          .set(bearer(userToken));
        const humedad = await request(app).get("/api/lecturas?tipo=humedad").set(bearer(userToken));

        expect(temperatura.status).toBe(200);
        expect(temperatura.body.data).toEqual([]);
        expect(temperatura.body.meta.total).toBe(0);
        expect(humedad.body.meta.total).toBe(6);
      });
    });
  });

  describe("Integridad de la relación sensor-lecturas", () => {
    it("debe rechazar con 409 Conflict eliminar un sensor que tiene lecturas", async () => {
      await postLectura({ sensorId, valor: 50, unidad: "%" });

      const response = await request(app)
        .delete(`/api/sensores/${sensorId}`)
        .set(bearer(adminToken));

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("SensorInUse");
    });

    it("debe permitir con 204 No Content eliminar un sensor sin lecturas", async () => {
      const response = await request(app)
        .delete(`/api/sensores/${sensorId}`)
        .set(bearer(adminToken));

      expect(response.status).toBe(204);
    });
  });
});