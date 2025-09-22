import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "ejanftgxxtlbadbqzdib.supabase.co", // your Supabase host
      "images.unsplash.com",               // Unsplash
      "ui-avatars.com",                    // avatar generation
    ],
  },
};

export default nextConfig;
