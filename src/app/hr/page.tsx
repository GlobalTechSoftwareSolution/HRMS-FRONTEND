'use client';
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";

export default function HRPage() {
  return (
    <DashboardLayout role="hr">
      {/* Header */}
      <motion.div 
        className="mb-6 text-black text-center mt-40 text-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h1
          className="text-2xl font-bold mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, yoyo: Infinity }}
        >
          Welcome HR 🧑‍💻
        </motion.h1>
        <motion.p
          className="text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Here you can manage employee records and HR tasks.
        </motion.p>
      </motion.div>
    </DashboardLayout>
  );
}
