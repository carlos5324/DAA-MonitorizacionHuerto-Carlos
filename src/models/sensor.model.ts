import mongoose, { Schema, Document } from "mongoose";
import { MAGNITUDES_SENSOR, MagnitudSensor } from "../types/huerto.types.js";

export interface ISensor extends Document {
  nombre: string;
  tipo: MagnitudSensor;
  unidad: string;       
  ubicacion: string;
  activo: boolean;      
  valorLimite: number;  
}

const sensorSchema = new Schema<ISensor>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    tipo: {
      type: String,
      enum: [...MAGNITUDES_SENSOR],
      required: true,
    },
    unidad: {
      type: String,
      required: true,
      trim: true,
    },
    ubicacion: {
      type: String,
      required: true,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    valorLimite: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const SensorModel = mongoose.model<ISensor>("Sensor", sensorSchema);

