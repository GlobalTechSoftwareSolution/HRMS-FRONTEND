"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";

export default function EmployeePage() {
  return (
    <DashboardLayout role="employee">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-6 text-black flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <h1 className="text-3xl font-bold mb-4">Welcome Employee 👩‍💼</h1>
        <p className="text-gray-600 text-lg">
          Here you can manage your tasks and profile.
        </p>
      </motion.div>
    </DashboardLayout>
  );
}
