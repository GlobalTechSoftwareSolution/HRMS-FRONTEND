import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "ui-avatars.com",
      "ejanftgxxtlbadbqzdib.supabase.co",
      "images.unsplash.com",
      "hrms-6qja.onrender.com",
      "127.0.0.1",       // <-- ADD THIS
      "localhost",       // <-- OPTIONAL: if you access via localhost
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://hrms-6qja.onrender.com/api/:path*', // Proxy to backend
      },
    ];
  },
};

export default nextConfig;
