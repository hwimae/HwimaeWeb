import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { AppConfig } from '../config';
import { conflict, unauthorized } from '../errors';
import { prisma } from '../prisma';
import type { AuthResponse, LoginInput, RegisterInput } from './auth.schema';

function createAuthResponse(
  config: AppConfig,
  user: { id: string; email: string; name: string },
): AuthResponse {
  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken: jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '7d',
    }),
  };
}

export async function register(config: AppConfig, input: RegisterInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw conflict('Email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name },
    });

    return createAuthResponse(config, user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw conflict('Email already exists');
    }
    throw error;
  }
}

export async function login(config: AppConfig, input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw unauthorized('Invalid credentials');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw unauthorized('Invalid credentials');
  }

  return createAuthResponse(config, user);
}
