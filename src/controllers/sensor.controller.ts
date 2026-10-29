import { Request, Response } from "express";
import { sensorService } from "../services/sensor.service.js";

export const getAllSensors = async (req: Request, res: Response) => {
  const sensors = await sensorService.getAllSensors();
  res.status(200).json({ status: "success", data: sensors });
};

export const getSensorById = async (req: Request, res: Response) => {
  const sensor = await sensorService.getSensorById(req.params.id as string);
  res.status(200).json({ status: "success", data: sensor });
};

export const createSensor = async (req: Request, res: Response) => {
  const newSensor = await sensorService.createSensor(req.body);
  res.status(201).json({ status: "success", data: newSensor });
};

export const updateSensor = async (req: Request, res: Response) => {
  const updatedSensor = await sensorService.updateSensor(req.params.id as string, req.body);
  res.status(200).json({ status: "success", data: updatedSensor });
};

export const deleteSensor = async (req: Request, res: Response) => {
  await sensorService.deleteSensor(req.params.id as string);
  res.status(204).send();
};

