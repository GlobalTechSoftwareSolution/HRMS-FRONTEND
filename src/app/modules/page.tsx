"use client";
import React from "react";
import { motion } from "framer-motion";
import { Users, Wallet, Clock, TrendingUp, UserCheck, PlusCircle } from "lucide-react";

const modules = [
  {
    label: "Workforce Management",
    icon: <Users className="w-10 h-10 text-orange-500" />,
    color: "from-orange-100 to-orange-50",
  },
  {
    label: "Payroll Management",
    icon: <Wallet className="w-10 h-10 text-blue-500" />,
    color: "from-blue-100 to-blue-50",
  },
  {
    label: "Attendance Management",
    icon: <Clock className="w-10 h-10 text-green-500" />,
    color: "from-green-100 to-green-50",
  },
  {
    label: "Performance Management",
    icon: <TrendingUp className="w-10 h-10 text-purple-500" />,
    color: "from-purple-100 to-purple-50",
  },
  {
    label: "Recruitment Management",
    icon: <UserCheck className="w-10 h-10 text-pink-500" />,
    color: "from-pink-100 to-pink-50",
  },
];

const HRModulesGrid: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      {/* Heading */}
      <div className="text-center mb-12">
  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-snug">
    <span className="bg-yellow-200 px-2 rounded">
      All-in-One HR Platform
    </span>{" "}
    <br />
  </h2>
  <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
    From hiring to payroll, performance to compliance — everything your HR
    team needs, in a single platform.
  </p>
</div>


      {/* Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 px-6">
        {modules.map((m, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-6 rounded-2xl shadow-md bg-gradient-to-br ${m.color} flex flex-col items-center justify-center text-center hover:shadow-xl transition`}
          >
            {m.icon}
            <p className="mt-4 font-semibold text-gray-800">{m.label}</p>
          </motion.div>
        ))}

      </div>
    </section>
  );
};

export default HRModulesGrid;
