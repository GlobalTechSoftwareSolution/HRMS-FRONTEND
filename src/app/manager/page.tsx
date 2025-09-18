"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";

export default function ManagerPage() {
  return (
    <DashboardLayout role="manager">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-black mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-2xl font-bold mb-4"
        >
          Welcome Manager 📊
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-gray-600"
        >
          Here you can manage your team and projects effectively.
        </motion.p>
      </div>
      {/* Add widgets, charts, tables here */}
    </DashboardLayout>
  );
}
