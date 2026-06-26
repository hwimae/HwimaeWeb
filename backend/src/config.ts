export type AppConfig = {
  databaseUrl: string;
  jwtSecret: string;
  port: number;
  frontendUrl: string;
  aiServiceUrl: string;
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2Bucket?: string;
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
    aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2Bucket: process.env.R2_BUCKET,
  };
}
