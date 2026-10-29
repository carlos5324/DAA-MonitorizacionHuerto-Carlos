import bcrypt from "bcryptjs";
import { userModel, IUser } from "../models/user.model.js";
import { tokenService } from "./token.service.js";
import { AuthResult, PublicUser } from "../types/huerto.types.js";
import { RegisterInput, LoginInput } from "../schemas/auth.schema.js";
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from "../errors/auth.errors.js";

const toPublicUser = (user: IUser): PublicUser => ({
  id: String(user._id),
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await userModel.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await userModel.create({
      email: input.email,
      password: passwordHash,
      fullName: input.fullName,
    });

    return this.buildAuthResult(user);
  }

  async login({ email, password }: LoginInput): Promise<AuthResult> {
    const user = await userModel.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) throw new InvalidCredentialsError();

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) throw new InvalidCredentialsError();

    return this.buildAuthResult(user);
  }

  private buildAuthResult(user: IUser): AuthResult {
    const token = tokenService.generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });
    return { token, user: toPublicUser(user) };
  }
}

export const authService = new AuthService();