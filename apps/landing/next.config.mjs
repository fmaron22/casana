import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // imagen mínima para Cloud Run (ADR-0007)
  outputFileTracingRoot: monorepoRoot, // traza deps desde la raíz del monorepo
};

export default nextConfig;
