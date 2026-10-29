import type { SignOptions } from "jsonwebtoken";
import { env } from "./env.js";

export const JWT_SECRET = env.jwtSecret;
export const JWT_EXPIRES_IN = env.jwtExpiresIn as SignOptions["expiresIn"];

