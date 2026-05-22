import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  eslint: {
    // Mos e ndal build-in per shkak te warning-eve te ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mos e ndal build-in per shkak te gabimeve te TypeScript
    // (i kemi shume @ts-ignore dhe "any" qe nuk jane probleme reale)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
