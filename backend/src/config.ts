export type AppConfig = {
  databaseUrl: string;
  jwtSecret: string;
  port: number;
  frontendUrl: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function parsePort(value: string | undefined): number {
  if (!value) return 4000;
  if (!/^\d+$/.test(value)) {
    throw new Error('PORT must be a number');
  }
  return Number(value);
}

export function loadConfig(): AppConfig {
  return {
    databaseUrl: requireEnv('DATABASE_URL'),
    jwtSecret: requireEnv('JWT_SECRET'),
    port: parsePort(process.env.PORT),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  };
}
