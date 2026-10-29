export const HUERTO_ROLES = ["administrador", "usuario"] as const;
export type UserRole = (typeof HUERTO_ROLES)[number];


export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export const MAGNITUDES_SENSOR = ["temperatura", "humedad", "luz"] as const;
export type MagnitudSensor = (typeof MAGNITUDES_SENSOR)[number];



