"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const Page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF1FF] to-white text-gray-900 flex flex-col items-center px-6 py-16">
      {/* Header */}
      <motion.h1
        className="text-5xl font-extrabold text-center mb-8 text-[#0026FF] tracking-tight"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Ratan Naval Tata
      </motion.h1>

      {/* Image Section */}
      <motion.div
        className="w-full flex justify-center mb-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="relative w-72 h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-[#0026FF]/10">
          <Image
            src="/images/ratan-tata.webp"
            alt="Ratan Tata"
            fill
            className="object-[10%_0%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>
      </motion.div>

      {/* Info Section */}
      <motion.div
        className="max-w-4xl bg-white p-10 rounded-3xl shadow-lg border border-gray-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Name", value: "Ratan Naval Tata" },
            { label: "Born", value: "28 December 1937" },
            { label: "Died", value: "9 October 2024" },
          ].map((info, i) => (
            <div key={i} className="bg-[#F8FAFF] p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                {info.label}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {info.value}
              </p>
            </div>
          ))}
        </div>

        {/* Inspiration & Philosophy */}
        <h2 className="text-2xl font-bold text-[#0026FF] mb-4 border-l-4 border-[#FF3B3B] pl-3">
          Inspiration & Philosophy
        </h2>
        <div className="space-y-4 mb-8 text-gray-700 leading-relaxed">
          <p>
            Ratan Tata embodied <strong>integrity</strong>, <strong>humility</strong>,
            and <strong>social responsibility</strong> as the foundation of true leadership.
          </p>

          <div className="space-y-3">
            {[
              "None can destroy iron, but its own rust can! Likewise, none can destroy a person, but their own mindset can.",
              "Take the stones people throw at you and use them to build a monument.",
              "The biggest risk is not taking any risk.",
            ].map((quote, i) => (
              <blockquote
                key={i}
                className="border-l-4 border-[#0026FF] pl-4 italic text-gray-800"
              >
                “{quote}”
              </blockquote>
            ))}
          </div>
        </div>

        {/* Mission / Values Table */}
        <h2 className="text-2xl font-bold text-[#0026FF] mb-4 border-l-4 border-[#FF3B3B] pl-3">
          Mission & Core Values
        </h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-[#F1F5FF] text-left">
                <th className="px-6 py-3 font-semibold text-gray-700 border-b border-gray-200">
                  Pillar
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700 border-b border-gray-200">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  pillar: "Service to Society",
                  desc: "Businesses must exist to uplift communities, not just generate profits.",
                },
                {
                  pillar: "Ethical Leadership",
                  desc: "Integrity and transparency are the true marks of greatness.",
                },
                {
                  pillar: "Innovation & Risk-taking",
                  desc: "Courage to innovate defines lasting progress.",
                },
                {
                  pillar: "Humility & Compassion",
                  desc: "Leadership is about empathy and humanity.",
                },
                {
                  pillar: "Legacy over Wealth",
                  desc: "Impact matters more than accumulation.",
                },
              ].map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#F9FBFF] transition-all duration-200"
                >
                  <td className="px-6 py-3 border-b border-gray-200 font-medium text-gray-800">
                    {item.pillar}
                  </td>
                  <td className="px-6 py-3 border-b border-gray-200 text-gray-700">
                    {item.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Famous Quote */}
        <blockquote className="text-center italic text-xl text-[#0026FF] font-semibold py-6 border-t border-b border-gray-200 mb-8">
          “I don't believe in taking the right decisions.  
          I take decisions and then make them right.”
        </blockquote>

        {/* Summary */}
        <h2 className="text-2xl font-bold text-[#0026FF] mb-3 border-l-4 border-[#FF3B3B] pl-3">
          Summary
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Ratan Tata’s life stands as a testament to ethical leadership, compassion,
          and innovation. His vision reshaped Indian industry, proving that success
          is best measured by how much good one brings to others. His humility and
          courage continue to inspire leaders around the world.
        </p>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <p className="text-[#0026FF] text-lg font-medium">
          “A visionary who led with purpose and heart.”
        </p>
        <div className="mt-4 h-0.5 w-32 bg-[#FF3B3B] mx-auto rounded-full"></div>
      </motion.div>
    </div>
  );
};

export default Page;
