import { Prisma } from '@prisma/client';
import type { BackendDeps } from '../dependencies';
import { conflict, unauthorized } from '../errors';
import type { AuthResponse, LoginInput, RegisterInput } from './auth.schema';

export type AuthService = {
  register(input: RegisterInput): Promise<AuthResponse>;
  login(input: LoginInput): Promise<AuthResponse>;
};

function createAuthResponse(
  deps: Pick<BackendDeps, 'tokenService'>,
  user: { id: string; email: string; name: string },
): AuthResponse {
  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken: deps.tokenService.signAccessToken(user),
  };
}

export function createAuthService(
  deps: Pick<BackendDeps, 'prisma' | 'passwordHasher' | 'tokenService'>,
): AuthService {
  return {
    async register(input) {
      const existing = await deps.prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw conflict('Email already exists');
      }

      const passwordHash = await deps.passwordHasher.hash(input.password);

      try {
        const user = await deps.prisma.user.create({
          data: { email: input.email, passwordHash, name: input.name },
        });

        return createAuthResponse(deps, user);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw conflict('Email already exists');
        }
        throw error;
      }
    },

    async login(input) {
      const user = await deps.prisma.user.findUnique({ where: { email: input.email } });
      if (!user) {
        throw unauthorized('Invalid credentials');
      }

      const valid = await deps.passwordHasher.compare(input.password, user.passwordHash);
      if (!valid) {
        throw unauthorized('Invalid credentials');
      }

      return createAuthResponse(deps, user);
    },
  };
}
