"use client";
import React from "react";
import { Github } from "lucide-react";
import { motion } from "framer-motion";

const Mainpage: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white overflow-hidden w-full">
      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl sm:text-6xl font-extrabold text-gray-900 mb-6 leading-tight mt-10"
      >
        Empower Your HR Team with{" "}
        <span className="text-red-500 underline">HRMS</span>
        <br />
        Software Solutions
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-gray-600 mb-10 text-lg max-w-2xl mx-auto"
      >
        Global Tech HRMS offers all the features you would expect from your favorite
        Open Source HR Software and much more.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
      >
        <a
          href="/login"
          className="inline-flex items-center justify-center bg-red-500 text-white py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-transform duration-300 font-semibold text-lg"
        >
           Try Demo
        </a>
        <a
          href="https://github.com/GlobalTechSoftwareSolution"
          target="_blank"
          className="inline-flex items-center justify-center border border-gray-400 py-3 px-8 rounded-full text-lg font-medium text-gray-800 hover:bg-gray-100 hover:scale-105 transition-transform duration-300"
        >
          <Github className="w-5 h-5 mr-2" />
          View on Github
        </a>
      </motion.div>

      {/* Illustration Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.3 },
          },
        }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center relative z-10"
      >
        {/* Left Image */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <motion.img
            src="/images/photo1.avif"
            alt="Employee List"
            className="w-72 rounded-xl shadow-md"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Center Illustration */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <motion.img
            src="/images/photo2.avif"
            alt="HR Management Illustration"
            className="w-80"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Right Task Board */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <motion.img
            src="/images/photo3.avif"
            alt="Task Board"
            className="w-72 rounded-xl shadow-md"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      {/* Decorative Dots */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="absolute bottom-0 left-10 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-50"
      ></motion.div>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 1.2, delay: 1 }}
        className="absolute top-0 right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"
      ></motion.div>
    </section>
  );
};

export default Mainpage;
