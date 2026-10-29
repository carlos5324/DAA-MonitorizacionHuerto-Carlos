import mongoose, { Schema, Document } from "mongoose";
import { HUERTO_ROLES, UserRole } from "../types/huerto.types.js";

export interface IUser extends Document {
  email: string;
  password: string; // Se guardará hasheada con bcrypt
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [...HUERTO_ROLES],
      default: "usuario",
    },
  },
  { timestamps: true, versionKey: false }
);

export const userModel = mongoose.model<IUser>("User", UserSchema);