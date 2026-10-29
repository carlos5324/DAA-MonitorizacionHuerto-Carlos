import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri);
  console.log("[MongoDB] Conectado con éxito");
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};