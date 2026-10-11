/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Document parsers are Node-only CommonJS packages; load them at runtime.
    serverComponentsExternalPackages: ["pdf-parse", "mammoth", "word-extractor"],
  },
};

module.exports = nextConfig;
