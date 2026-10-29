import "dotenv/config";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
};

const port = Number(process.env.PORT ?? 3005);
if (Number.isNaN(port)) {
  throw new Error("PORT debe ser un número");
}

export const env = {
  port,
  mongoUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: required("JWT_EXPIRES_IN"),
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

