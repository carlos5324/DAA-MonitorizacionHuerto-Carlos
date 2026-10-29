import mongoose, { Schema, Document } from "mongoose";

export interface ILectura extends Document {
  sensorId: mongoose.Types.ObjectId; 
  valor: number;
  unidad: string;
  esAnomala: boolean; 
  tiempo: Date;
}

const lecturaSchema = new Schema<ILectura>(
  {
    sensorId: {
      type: Schema.Types.ObjectId,
      ref: "Sensor",
      required: true,
    },
    valor: {
      type: Number,
      required: true,
    },
    unidad: {
      type: String,
      required: true,
      trim: true,
    },
    esAnomala: {
      type: Boolean,
      required: true,
    },
    tiempo: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
   { timestamps: true, versionKey: false }
);

lecturaSchema.index({ sensorId: 1, tiempo: -1 });
export const LecturaModel = mongoose.model<ILectura>("Lectura", lecturaSchema);