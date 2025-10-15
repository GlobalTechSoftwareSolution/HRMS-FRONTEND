import type { NextConfig } from "next";

const nextConfig: NextConfig = {
images: {
  remotePatterns: [
    { protocol: "https", hostname: "cdn.britannica.com", pathname: "/**" },
    { protocol: "https", hostname: "minio.globaltechsoftwaresolutions.cloud", port: "9000", pathname: "/hrms-media/**" },
    { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
    { protocol: "https", hostname: "ejanftgxxtlbadbqzdib.supabase.co", pathname: "/**" },
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "https", hostname: "hrms-6qja.onrender.com", pathname: "/**" },
  ],
},

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://hrms-6qja.onrender.com/api/:path*", // Proxy to backend
      },
    ];
  },
};

export default nextConfig;
