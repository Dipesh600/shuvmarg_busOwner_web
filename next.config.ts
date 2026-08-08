import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
let apiOrigin = "";
try {
  apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : "";
} catch {
  apiOrigin = "";
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com https://shuvmarg.vercel.app",
  "img-src 'self' data: blob: https:",
  "frame-src 'self' blob:",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}${isDevelopment ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Optimize output for deployment
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  // Pin Next 16.3's development validation default. This avoids the dev
  // runtime receiving an undefined instantInsights object after upgrades/HMR.
  experimental: {
    instantInsights: {
      validationLevel: "warning",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
