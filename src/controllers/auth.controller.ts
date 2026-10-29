import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json({ status: "success", data: result });
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(200).json({ status: "success", data: result });
};
