# API de Monitorización de un Huerto

API REST para gestionar los sensores de un huerto y registrar sus lecturas. El servidor decide si una lectura es anómala comparándola con el límite de su sensor.

Práctica individual de evaluación continua · Desarrollo de Aplicaciones Avanzadas · Grado en Ingeniería Informática.

## Tecnologías

Node.js · Express 5 · TypeScript · MongoDB con Mongoose · Zod (validación) · JWT + bcryptjs (autenticación) · Swagger UI / OpenAPI · Vitest + Supertest (tests)

## Requisitos

- Node.js 20 o superior (`node -v`)
- Una base de datos MongoDB: una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/atlas) o MongoDB instalado en local

## Puesta en marcha

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone <URL-DEL-REPOSITORIO>
   cd <CARPETA-DEL-REPOSITORIO>
   npm install
   ```

2. Crea tu fichero de configuración a partir de la plantilla y rellénalo:

   ```bash
   cp .env.example .env
   ```

   En Windows PowerShell: `copy .env.example .env`.

3. Arranca el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   Verás `Servidor escuchando en http://localhost:3005`. Comprueba que funciona en `http://localhost:3005/api/health`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3005` |
| `MONGODB_URI` | Cadena de conexión a MongoDB, **incluyendo el nombre de la base de datos** antes del `?` | `mongodb+srv://usuario:clave@cluster.mongodb.net/huerto?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secreto con el que se firman los tokens. Usa una cadena larga y aleatoria | (genera una con el comando de abajo) |
| `JWT_EXPIRES_IN` | Duración del token | `1h`, `24h`, `7d` |

Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

El fichero `.env` está en `.gitignore` y nunca se sube al repositorio. Si falta alguna variable obligatoria, el servidor se niega a arrancar y dice cuál.

## Crear el primer administrador

El registro público solo crea usuarios con rol `usuario` (nadie puede hacerse administrador a sí mismo). Para tener el primer administrador:

1. Regístrate con `POST /api/auth/register`.
2. En MongoDB (Atlas → Browse Collections → base `huerto` → colección `users`, o Compass), edita tu usuario y cambia el campo `role` a `administrador`.
3. Vuelve a hacer login con `POST /api/auth/login`: el rol viaja dentro del token, así que hace falta un token nuevo.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca el servidor con recarga automática |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada (`dist/server.js`) |
| `npm test` | Ejecuta los tests de integración una vez |
| `npm run test:watch` | Ejecuta los tests y los repite al guardar cambios |
| `npm run typecheck` | Comprueba los tipos sin generar ficheros |

## Tests

```bash
npm test
```

Los tests usan una base de datos MongoDB **temporal en memoria** (`mongodb-memory-server`), así que no tocan tus datos reales ni necesitan un `.env`. La primera ejecución descarga un binario de MongoDB y tarda un poco más.

Cubren: registro y login (incluidos los fallos), bloqueo por rol (401 frente a 403), ciclo de vida completo de un sensor, cálculo de anomalías en el servidor, consultas con paginación + filtro + orden combinados, integridad entre sensores y lecturas, y el manejo global de errores.

## Documentación de la API

Con el servidor arrancado, abre **http://localhost:3005/api/docs** (Swagger UI).

Para probar rutas protegidas: haz `POST /auth/login` desde la propia página, copia el `token`, pulsa **Authorize** y pégalo (sin la palabra `Bearer`).

## Endpoints

| Método | Ruta | Acceso | Éxito | Descripción |
|---|---|---|---|---|
| POST | `/api/auth/register` | Público | 201 | Alta de usuario (rol `usuario`) |
| POST | `/api/auth/login` | Público | 200 | Obtener token |
| GET | `/api/sensores` | Autenticado | 200 | Listar sensores |
| GET | `/api/sensores/:id` | Autenticado | 200 | Detalle de un sensor |
| POST | `/api/sensores` | Administrador | 201 | Crear sensor |
| PATCH | `/api/sensores/:id` | Administrador | 200 | Modificar sensor (parcial) |
| DELETE | `/api/sensores/:id` | Administrador | 204 | Eliminar sensor (409 si tiene lecturas) |
| POST | `/api/lecturas` | Autenticado | 201 | Registrar lectura |
| GET | `/api/lecturas` | Autenticado | 200 | Histórico paginado, filtrable y ordenable |

Parámetros de `GET /api/lecturas` (todos opcionales y combinables):

| Parámetro | Valores | Por defecto |
|---|---|---|
| `pagina` | entero ≥ 1 | `1` |
| `limite` | entero entre 1 y 100 | `20` |
| `sensorId` | ID de un sensor | (sin filtro) |
| `tipo` | `temperatura`, `humedad`, `luz` | (sin filtro) |
| `anomala` | `true`, `false` | (sin filtro) |
| `orden` | `tiempo`, `-tiempo`, `valor`, `-valor` (el `-` indica descendente) | `-tiempo` |

Ejemplo: `GET /api/lecturas?tipo=humedad&anomala=true&orden=-valor&pagina=1&limite=5`

## Formato de las respuestas

Éxito:

```json
{ "status": "success", "data": { } }
```

Los listados paginados añaden `"meta": { "page", "limit", "total", "totalPages" }`.

Error (`status` es `fail` en errores 4xx y `error` en errores 5xx):

```json
{ "status": "fail", "error": "ValidationError", "message": "...", "details": [{ "field": "email", "message": "..." }] }
```

## Decisiones de diseño

- **Códigos de estado:** 401 si no hay identidad (sin token o token inválido) y 403 si la hay pero no basta (rol insuficiente). 404 si el recurso no existe, 409 en conflictos (email repetido, sensor con lecturas) y 422 si el sensor existe pero está inactivo.
- **Anomalías:** una lectura es anómala si `valor > valorLimite` de su sensor. Lo calcula siempre el servidor; el cliente no puede enviar ese campo.
- **Relación:** cada lectura guarda solo la referencia (`sensorId`) a su sensor; el tipo de magnitud no se copia, se obtiene del sensor al filtrar.
- **Límite conocido:** el rol viaja dentro del token, así que un cambio de rol no se refleja hasta que el token caduque o el usuario vuelva a hacer login.

## Estructura del proyecto

```
src/
├── app.ts            Configura Express (middlewares y rutas); no arranca el servidor
├── server.ts         Conecta a MongoDB y arranca el servidor
├── config/           Variables de entorno, conexión a la base de datos y JWT
├── errors/           Clases de error de la aplicación
├── schemas/          Esquemas de validación de entrada (Zod)
├── middlewares/      Autenticación, roles, validación y manejo de errores
├── docs/             Especificación OpenAPI
├── routes/           Rutas (qué endpoint pasa por qué middlewares)
├── controllers/      Traducen HTTP a llamadas a los servicios
├── services/         Lógica de negocio
├── models/           Esquemas de Mongoose
└── types/            Tipos de TypeScript
tests/
└── integration/      Tests con Vitest + Supertest
```
