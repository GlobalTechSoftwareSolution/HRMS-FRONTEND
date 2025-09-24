// lib/nhost.ts
import { NhostClient } from "@nhost/nextjs";

// Lazy initialization function
export const getNhost = () => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is missing. Check your .env.local");
  }

  return new NhostClient({ backendUrl });
};
