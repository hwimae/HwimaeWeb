import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  outputFileTracingIncludes: {
    '/stories': ['./node_modules/.pnpm/next@*/node_modules/next/dist/compiled/source-map/**/*'],
    '/stories/[id]': ['./node_modules/.pnpm/next@*/node_modules/next/dist/compiled/source-map/**/*'],
  },
};

export default nextConfig;
