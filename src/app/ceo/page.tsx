"use client";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";

export default function CEOPage() {
  return (
    <DashboardLayout role="ceo">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center justify-center text-center min-h-[70vh] text-black"
      >
        <h1 className="text-2xl font-bold mb-4">Welcome CEO 👑</h1>
        <p className="text-gray-600">
          Here you can manage your company at a high level.
        </p>
      </motion.div>
      {/* Add widgets, charts, tables here */}
    </DashboardLayout>
  );
}
