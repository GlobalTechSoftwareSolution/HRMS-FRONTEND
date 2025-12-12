import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.britannica.com", pathname: "/**" },
      { protocol: "https", hostname: "minio.globaltechsoftwaresolutions.cloud", port: "9000", pathname: "/hrms-media/**" },
      { protocol: "https", hostname: "minio.globaltechsoftwaresolutions.cloud", pathname: "/hrms-media/**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      { protocol: "https", hostname: "ejanftgxxtlbadbqzdib.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "hrms-6qja.onrender.com", pathname: "/**" },

      // ✅ Add this line for your http image
      { protocol: "http", hostname: "globaltechsoftwaresolutions.cloud", pathname: "/images/**" },
      // Optional: also allow https for the same host if some images use https
      { protocol: "https", hostname: "globaltechsoftwaresolutions.cloud", pathname: "/images/**" },
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com", pathname: "/**" },
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
