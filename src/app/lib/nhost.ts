// lib/nhost.ts
import { NhostClient } from "@nhost/nextjs";

// Initialize Nhost client with subdomain and region
export const nhost = new NhostClient({
  subdomain: "HRMS",
  region: "ap-south-1", // Mumbai region
});
