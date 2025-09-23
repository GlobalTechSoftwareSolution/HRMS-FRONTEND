// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "ui-avatars.com",
      "ejanftgxxtlbadbqzdib.supabase.co",
      "images.unsplash.com",
      "hrms-6qja.onrender.com", // Add your backend host
    ],
  },
};

export default nextConfig;
