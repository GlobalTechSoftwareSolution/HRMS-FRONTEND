// app/unauthorized/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-gray-200 p-6">
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white shadow-xl rounded-2xl max-w-md w-full p-10 text-center border border-gray-100"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-600"
        >
          <Lock size={40} />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
          Access Denied
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-base leading-relaxed mb-8">
          You don’t have permission to access this page. Please contact the
          administrator if you believe this is an error.
        </p>

        {/* Button */}
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition"
          >
            Return to Dashboard
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
