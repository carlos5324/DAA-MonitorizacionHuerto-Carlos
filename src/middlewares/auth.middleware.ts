import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";
import { AuthTokenPayload, UserRole, HUERTO_ROLES } from "../types/huerto.types.js";
import { UnauthorizedError, InvalidTokenError, ForbiddenError } from "../errors/auth.errors.js";

// Tipado de req.user: a partir de aquí, cualquier handler posterior a
// authenticateToken puede leer req.user.userId / req.user.role con tipos.
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const authenticateToken = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError());
  }

  const token = authHeader.split(" ")[1];

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return next(new InvalidTokenError());
  }

  const payload = decoded as Partial<AuthTokenPayload>;
  if (
    typeof payload?.userId !== "string" ||
    !HUERTO_ROLES.includes(payload.role as UserRole)
  ) {
    return next(new InvalidTokenError());
  }

  req.user = payload as AuthTokenPayload;
  next();

};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    next();
  };
};