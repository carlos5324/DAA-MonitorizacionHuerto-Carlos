# API de Monitorización de un Huerto

API REST desarrollada para gestionar los sensores de un huerto y registrar sus lecturas. La aplicación permite consultar el histórico de mediciones y detectar posibles anomalías comparando los valores registrados con los límites establecidos para cada sensor.

Proyecto individual de evaluación continua · Desarrollo de Aplicaciones Avanzadas · Grado en Ingeniería Informática.

## Tecnologías

- **Node.js** y **Express 5**: desarrollo del servidor y la API REST.
- **TypeScript**: tipado y organización del código.
- **MongoDB** y **Mongoose**: almacenamiento y gestión de datos.
- **Zod**: validación de datos de entrada.
- **JWT** y **bcryptjs**: autenticación y protección de contraseñas.
- **Swagger UI / OpenAPI**: documentación de la API.
- **Vitest** y **Supertest**: pruebas de integración.

## Requisitos

- Node.js 20 o superior.
- MongoDB instalado en local o una base de datos en [MongoDB Atlas](https://www.mongodb.com/atlas).

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <URL-DEL-REPOSITORIO>
cd <CARPETA-DEL-REPOSITORIO>
npm install
```

### 2. Configurar las variables de entorno

Crea el fichero `.env` a partir de la plantilla:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configura las variables necesarias para la conexión a MongoDB y el funcionamiento del servidor.

### 3. Iniciar el servidor

En modo desarrollo:

```bash
npm run dev
```

Por defecto, el servidor escucha en:

`http://localhost:3005`

Para comprobar que está funcionando, accede a:

`http://localhost:3005/api/health`

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3005` |
| `MONGODB_URI` | Cadena de conexión a MongoDB, incluyendo el nombre de la base de datos | `mongodb://localhost:27017/huerto` |
| `JWT_SECRET` | Secreto utilizado para firmar los tokens | Cadena aleatoria segura |
| `JWT_EXPIRES_IN` | Duración del token | `1h`, `24h`, `7d` |

El formato de `MONGODB_URI` dependerá de si se utiliza MongoDB local o Atlas.

Para generar un secreto JWT aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

El fichero `.env` debe permanecer fuera del repositorio y estar incluido en `.gitignore`. No se deben publicar credenciales ni secretos.

Si falta alguna variable obligatoria, el servidor no se inicia e indica el problema de configuración.

## Crear el primer administrador

El registro público crea usuarios con el rol `usuario`. Para disponer de un administrador inicialmente:

1. Regístrate mediante `POST /api/auth/register`.
2. Accede a MongoDB Atlas, Compass o `mongosh`.
3. Localiza al usuario en la colección `users` de la base de datos `huerto` y cambia su campo `role` a `administrador`.
4. Inicia sesión de nuevo mediante `POST /api/auth/login` para obtener un token actualizado.

El rol está incluido en el token JWT, por lo que es necesario obtener uno nuevo después del cambio.

Este procedimiento está pensado para la configuración inicial de la práctica y debe realizarse con acceso autorizado a la base de datos.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo |
| `npm run build` | Compila TypeScript en `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `npm test` | Ejecuta las pruebas de integración |
| `npm run test:watch` | Ejecuta las pruebas en modo observación |
| `npm run typecheck` | Comprueba los tipos sin generar archivos |

## Pruebas

Para ejecutar las pruebas:

```bash
npm test
```

Las pruebas utilizan una base de datos temporal en memoria mediante `mongodb-memory-server`, por lo que no necesitan utilizar la base de datos real del proyecto.

La primera ejecución puede tardar algo más debido a la descarga del binario de MongoDB.

Las pruebas de integración cubren, entre otros aspectos:

- Registro e inicio de sesión.
- Autenticación y autorización según el rol.
- Operaciones de gestión de sensores.
- Registro de lecturas y cálculo de anomalías.
- Consultas con filtros, ordenación y paginación combinados.
- Integridad de la relación entre sensores y lecturas.
- Comportamiento ante diferentes errores y situaciones.

## Documentación de la API

Con el servidor iniciado, accede a Swagger UI:

**[http://localhost:3005/api/docs](http://localhost:3005/api/docs)**

Desde esta página se pueden consultar los endpoints, sus parámetros y los modelos de respuesta, así como realizar peticiones de prueba.

Para probar las rutas protegidas:

1. Realiza un `POST /api/auth/login`.
2. Copia el token recibido.
3. Pulsa **Authorize** en Swagger UI.
4. Introduce el token según el formato solicitado por la documentación.

## Endpoints

| Método | Ruta | Acceso | Éxito | Descripción |
|---|---|---|---|---|
| POST | `/api/auth/register` | Público | 201 | Registro de usuario |
| POST | `/api/auth/login` | Público | 200 | Inicio de sesión y obtención del token |
| GET | `/api/sensores` | Autenticado | 200 | Listar sensores |
| GET | `/api/sensores/:id` | Autenticado | 200 | Consultar un sensor |
| POST | `/api/sensores` | Administrador | 201 | Crear sensor |
| PATCH | `/api/sensores/:id` | Administrador | 200 | Modificar sensor |
| DELETE | `/api/sensores/:id` | Administrador | 204 | Eliminar sensor |

La eliminación de un sensor no está permitida si tiene lecturas asociadas; en ese caso, se devuelve un `409 Conflict`.

| Método | Ruta | Acceso | Éxito | Descripción |
|---|---|---|---|---|
| POST | `/api/lecturas` | Autenticado | 201 | Registrar una lectura |
| GET | `/api/lecturas` | Autenticado | 200 | Consultar el histórico de lecturas |

## Consulta de lecturas

El endpoint `GET /api/lecturas` permite combinar distintos parámetros para filtrar, ordenar y paginar los resultados.

| Parámetro | Valores | Por defecto |
|---|---|---|
| `pagina` | Entero ≥ 1 | `1` |
| `limite` | Entero entre 1 y 100 | `20` |
| `sensorId` | ID de un sensor | Sin filtro |
| `tipo` | `temperatura`, `humedad`, `luz` | Sin filtro |
| `anomala` | `true`, `false` | Sin filtro |
| `orden` | `tiempo`, `-tiempo`, `valor`, `-valor` | `-tiempo` |

El signo `-` indica orden descendente.

Ejemplo de consulta combinada:

```http
GET /api/lecturas?tipo=humedad&anomala=true&orden=-valor&pagina=1&limite=5
```

La respuesta de los listados incluye información de paginación:

```json
{
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 42,
    "totalPages": 9
  }
}
```

Los valores son ilustrativos.

## Formato de las respuestas

Las respuestas satisfactorias utilizan una estructura común:

```json
{
  "status": "success",
  "data": {}
}
```

Los listados paginados incluyen también el objeto `meta`.

Ejemplo de respuesta de error:

```json
{
  "status": "fail",
  "error": "ValidationError",
  "message": "...",
  "details": [
    {
      "field": "email",
      "message": "..."
    }
  ]
}
```

La estructura concreta de los errores puede variar según el tipo de problema.

## Decisiones de diseño

- **Autenticación y autorización:** se utiliza JWT para identificar al usuario y controlar el acceso según su rol.
- **Códigos de estado HTTP:** se diferencian los errores de autenticación (`401`) de los errores de permisos (`403`). También se utilizan respuestas como `404`, `409` y `422` cuando corresponde.
- **Detección de anomalías:** una lectura se considera anómala cuando su valor supera el límite establecido para su sensor (`valor > valorLimite`). Este cálculo se realiza en el servidor.
- **Relación entre sensores y lecturas:** cada lectura almacena una referencia al sensor mediante `sensorId`.
- **Validación:** se validan los datos de entrada para reducir errores y mantener la coherencia de la información.
- **Consultas:** los filtros, la ordenación y la paginación permiten consultar el histórico de forma más eficiente.
- **Gestión de roles:** el rol forma parte del token JWT, por lo que los cambios de rol requieren renovar el token.

## Estructura del proyecto

```text
src/
├── app.ts           Configuración de Express y rutas
├── server.ts        Conexión a MongoDB e inicio del servidor
├── config/          Configuración y variables de entorno
├── errors/          Errores de la aplicación
├── schemas/         Validación de datos con Zod
├── middlewares/     Autenticación, roles y validaciones
├── docs/            Documentación OpenAPI
├── routes/          Definición de rutas
├── controllers/     Gestión de peticiones HTTP
├── services/        Lógica de negocio
├── models/          Modelos de Mongoose
└── types/           Tipos de TypeScript

tests/
└── integration/     Pruebas de integración
```
