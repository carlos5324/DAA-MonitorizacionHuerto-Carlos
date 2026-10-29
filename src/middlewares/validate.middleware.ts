import { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { InvalidIdError } from "../errors/resource.errors.js";

export const validateObjectId = (paramName: string = "id") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const id = req.params[paramName] as string;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return next(new InvalidIdError(paramName, id));
    }
    next();
  };
};

export const validateBody = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return next(result.error);
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query ?? {});
    if (!result.success) {
      return next(result.error);
    }
    res.locals.query = result.data;
    next();
  };
};