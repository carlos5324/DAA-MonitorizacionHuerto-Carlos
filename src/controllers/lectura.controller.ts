import { Request, Response } from "express";
import { lecturaService } from "../services/lectura.service.js";

export const createLectura = async (req: Request, res: Response) => {
  const newLectura = await lecturaService.createLectura(req.body);
  res.status(201).json({ status: "success", data: newLectura });
};

export const getLecturas = async (req: Request, res: Response) => {
  const result = await lecturaService.getLecturas(res.locals.query);
  res.status(200).json({
    status: "success",
    data: result.data,
    meta: result.meta,
  });
};
