"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";


export default function HRStandOut() {
  const features = [
  {
    title: "AI Automation",
    desc: "Streamline HR tasks with AI-powered workflows, from attendance to payroll, saving time and reducing errors.",
    img: "/images/image1.png",
    w: 150,
    h: 145,
  },
  {
    title: "Data-Driven Insights",
    desc: "Make smarter HR decisions with real-time analytics on employee performance, engagement, and growth.",
    img: "/images/image2.png",
    w: 180,
    h: 150,
  },
  {
    title: "Seamless Collaboration",
    desc: "Empower your team with a unified HR platform where communication, approvals, and feedback happen effortlessly.",
    img: "/images/image3.png",
    w: 160,
    h: 140,
  },
];


  return (
    <section className="relative py-16 bg-gradient-to-b from-blue-50 to-indigo-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Background pattern */}
        <motion.img
          src="https://www.horilla.com/wp-content/themes/horilla-wp-theme-main/assets/images/design/pattern-horilla.svg"
          alt="Product Background Pattern"
          width={989}
          height={614}
          className="absolute right-0 top-10 w-[600px] opacity-20 pointer-events-none"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.2, x: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Section Title */}
        <motion.h3
          className="text-3xl font-bold text-center text-gray-800 mb-12"
          initial={{ opacity: 0, y: -40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Why <span className="text-blue-600">Global Tech HRMS</span> is Exceptional
        </motion.h3>

        {/* Features Grid */}
        <ul className="grid md:grid-cols-3 gap-10">
          {features.map((f, i) => (
            <motion.li
              key={i}
              className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow hover:shadow-xl transition"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: i * 0.2,
                ease: "easeOut",
              }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="mb-6"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.6 }}
              >
               <Image
  src={f.img}
  alt={f.title}
  width={f.w}
  height={f.h}
  className="mx-auto object-contain"
/>
              </motion.div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                {f.title}
              </h4>
              <p className="text-gray-600">{f.desc}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
