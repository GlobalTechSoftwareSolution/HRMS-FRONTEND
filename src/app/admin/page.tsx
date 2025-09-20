"use client";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminPage() {
  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        {/* Animated Heading */}
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome Admin 🚀
        </motion.h1>

        {/* Animated Subtext */}
        <motion.p
          className="text-gray-600 text-lg md:text-xl max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Here you can manage your company efficiently. Monitor employees,
          approve requests, and configure settings — all in one place.
        </motion.p>
      </div>
    </DashboardLayout>
  );
}
