// src/docs/openapi.ts (versión compacta)
// Especificación OpenAPI 3.0.3 de la API del huerto, servida con Swagger UI en /api/docs.

// Cuerpo de cualquier respuesta de error: { status, error, message, details? }
const errorBody = {
  "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
};

// Cuerpo de una respuesta de éxito: { status: "success", data }
const ok = (data: object) => ({
  "application/json": {
    schema: {
      type: "object",
      properties: { status: { type: "string", example: "success" }, data },
    },
  },
});

const sensorFields = {
  nombre: { type: "string", example: "Humedad invernadero" },
  tipo: { type: "string", enum: ["temperatura", "humedad", "luz"] },
  unidad: { type: "string", example: "%" },
  ubicacion: { type: "string", example: "Invernadero" },
  activo: { type: "boolean", example: true },
  valorLimite: {
    type: "number",
    example: 80,
    description: "Una lectura es anómala si su valor supera este límite",
  },
};

const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "ID del sensor (ObjectId de MongoDB)",
  schema: { type: "string", example: "64b7f0f0f0f0f0f0f0f0f0f0" },
};

export const openapiSpec: Record<string, unknown> = {
  openapi: "3.0.3",
  info: {
    title: "API de Monitorización de un Huerto",
    version: "1.0.0",
    description:
      "Gestión de sensores y lecturas. Regístrate y haz login en /auth, pulsa Authorize y pega el token (sin la palabra Bearer). Roles: `usuario` consulta sensores y registra lecturas; `administrador` además gestiona sensores. El servidor calcula si una lectura es anómala (valor > valorLimite).",
  },
  servers: [{ url: "/api", description: "Servidor actual" }],
  tags: [
    { name: "Auth", description: "Alta de usuarios y obtención del token" },
    { name: "Sensores", description: "Catálogo de sensores" },
    { name: "Lecturas", description: "Mediciones de los sensores" },
  ],
  // Todas las operaciones piden token salvo las que ponen `security: []`
  security: [{ bearerAuth: [] }],

  paths: {
    "/auth/register": {
      post: {
        summary: "Registrar un usuario (rol usuario)",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } },
        },
        responses: {
          "201": { description: "Usuario creado", content: ok({ $ref: "#/components/schemas/AuthResult" }) },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { description: "El email ya está registrado", content: errorBody },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Iniciar sesión y obtener el token",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
        },
        responses: {
          "200": { description: "Login correcto", content: ok({ $ref: "#/components/schemas/AuthResult" }) },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { description: "Credenciales incorrectas", content: errorBody },
        },
      },
    },

    "/sensores": {
      get: {
        summary: "Listar sensores (cualquier usuario autenticado)",
        tags: ["Sensores"],
        responses: {
          "200": {
            description: "Catálogo de sensores",
            content: ok({ type: "array", items: { $ref: "#/components/schemas/Sensor" } }),
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        summary: "Crear un sensor (solo administrador)",
        tags: ["Sensores"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SensorInput" } } },
        },
        responses: {
          "201": { description: "Sensor creado", content: ok({ $ref: "#/components/schemas/Sensor" }) },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/sensores/{id}": {
      parameters: [idParam],
      get: {
        summary: "Detalle de un sensor (cualquier usuario autenticado)",
        tags: ["Sensores"],
        responses: {
          "200": { description: "Sensor encontrado", content: ok({ $ref: "#/components/schemas/Sensor" }) },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Modificar campos de un sensor (solo administrador)",
        tags: ["Sensores"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                minProperties: 1,
                description: "Cualquier subconjunto (al menos uno) de los campos del sensor",
                properties: sensorFields,
              },
            },
          },
        },
        responses: {
          "200": { description: "Sensor actualizado", content: ok({ $ref: "#/components/schemas/Sensor" }) },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Eliminar un sensor (solo administrador)",
        tags: ["Sensores"],
        responses: {
          "204": { description: "Sensor eliminado" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { description: "El sensor tiene lecturas asociadas y no se puede eliminar", content: errorBody },
        },
      },
    },

    "/lecturas": {
      post: {
        summary: "Registrar una lectura (cualquier usuario autenticado)",
        description:
          "El servidor calcula `esAnomala` comparando `valor` con el `valorLimite` del sensor. El cliente no puede enviarlo.",
        tags: ["Lecturas"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LecturaInput" } } },
        },
        responses: {
          "201": { description: "Lectura registrada", content: ok({ $ref: "#/components/schemas/Lectura" }) },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { description: "El sensor indicado no existe", content: errorBody },
          "422": { description: "El sensor existe pero está inactivo", content: errorBody },
        },
      },
      get: {
        summary: "Histórico de lecturas: paginado, filtrable y ordenable",
        description: "Todos los parámetros son opcionales y se pueden combinar en una misma consulta.",
        tags: ["Lecturas"],
        parameters: [
          { name: "pagina", in: "query", description: "Número de página", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limite", in: "query", description: "Elementos por página", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "sensorId", in: "query", description: "Filtrar por ID del sensor", schema: { type: "string" } },
          { name: "tipo", in: "query", description: "Filtrar por magnitud del sensor", schema: { type: "string", enum: ["temperatura", "humedad", "luz"] } },
          { name: "anomala", in: "query", description: "true: solo anómalas. false: solo normales", schema: { type: "string", enum: ["true", "false"] } },
          { name: "orden", in: "query", description: "Orden (prefijo - = descendente)", schema: { type: "string", enum: ["tiempo", "-tiempo", "valor", "-valor"], default: "-tiempo" } },
        ],
        responses: {
          "200": {
            description: "Página de lecturas con sus metadatos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Lectura" } },
                    meta: {
                      type: "object",
                      properties: {
                        page: { type: "integer", example: 1 },
                        limit: { type: "integer", example: 20 },
                        total: { type: "integer", example: 42 },
                        totalPages: { type: "integer", example: 3 },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    responses: {
      BadRequest: { description: "Datos de entrada no válidos o ID mal formado", content: errorBody },
      Unauthorized: { description: "No identificado: falta el token o es inválido o ha caducado", content: errorBody },
      Forbidden: { description: "Identificado pero sin permiso: se requiere rol administrador", content: errorBody },
      NotFound: { description: "El sensor no existe", content: errorBody },
    },
    schemas: {
      RegisterInput: {
  type: "object",
  required: ["email", "password", "fullName"],
  additionalProperties: false,
  properties: {
    email: { type: "string", example: "ana@example.com" },
    password: { type: "string", minLength: 8, example: "Password123" },
    fullName: { type: "string", example: "Ana Pérez" },
  },
},
LoginInput: {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", example: "ana@example.com" },
    password: { type: "string", example: "Password123" },
  },
},
      AuthResult: {
        type: "object",
        properties: {
          token: { type: "string", description: "Token JWT" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              fullName: { type: "string" },
              role: { type: "string", enum: ["administrador", "usuario"] },
            },
          },
        },
      },
      Sensor: {
        type: "object",
        properties: { _id: { type: "string", example: "64b7f0f0f0f0f0f0f0f0f0f0" }, ...sensorFields, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } },
      },
      SensorInput: {
        type: "object",
        required: ["nombre", "tipo", "unidad", "ubicacion", "activo", "valorLimite"],
        properties: sensorFields,
        additionalProperties: false
      },
      Lectura: {
        type: "object",
        properties: {
          _id: { type: "string" },
          sensorId: { type: "string", description: "ID del sensor de origen" },
          valor: { type: "number", example: 95 },
          unidad: { type: "string", example: "%" },
          esAnomala: { type: "boolean", description: "Calculado por el servidor", example: true },
          tiempo: { type: "string", format: "date-time" },
        },
      },
      LecturaInput: {
        type: "object",
        required: ["sensorId", "valor", "unidad"],
        properties: {
          sensorId: { type: "string", description: "ID de un sensor existente y activo", example: "64b7f0f0f0f0f0f0f0f0f0f0", pattern: "^[0-9a-fA-F]{24}$" },
          valor: { type: "number", example: 95 },
          unidad: { type: "string", example: "%" },
          tiempo: { type: "string", format: "date-time", description: "Opcional. Por defecto, la hora del servidor" },
          additionalProperties: false
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["fail", "error"], example: "fail" },
          error: { type: "string", example: "ValidationError" },
          message: { type: "string" },
          details: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
};