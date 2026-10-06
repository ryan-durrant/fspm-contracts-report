import type { NextConfig } from "next";

function normalizeBasePath(value: string | undefined) {
  if (!value || value === "/") return "";
  const trimmed = value.endsWith("/") ? value.slice(0, -1) : value;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const basePath = normalizeBasePath(process.env.BASE_PATH);

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  agentRules: false,
  images: { unoptimized: true },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
