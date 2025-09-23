import type { NextConfig } from "next"

const nextConfig: NextConfig = {
 turbopack: {
    root: '../', // Définit la racine du monorepo
  },
};

export default nextConfig;
