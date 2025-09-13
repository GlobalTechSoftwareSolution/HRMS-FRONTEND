// ServicesHRMS.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";

const services = [
  {
    id: "employee-management",
    title: "Employee Management",
    bullets: [
      "Add, update, remove employees",
      "Manage roles, departments & salaries",
      "Secure storage of employee documents",
    ],
    icon: "👥",
  },
  {
    id: "attendance-leave",
    title: "Attendance & Leave",
    bullets: [
      "Face recognition check-in / check-out",
      "Automated attendance reports",
      "Leave approval workflow",
    ],
    icon: "🕒",
  },
  {
    id: "payroll",
    title: "Payroll",
    bullets: [
      "Automatic salary calculations",
      "Payslip PDF generation",
      "Salary history & deductions",
    ],
    icon: "💰",
  },
  {
    id: "task-management",
    title: "Task Management",
    bullets: [
      "Assign tasks to employees",
      "Track status & progress",
      "Daily / weekly reporting",
    ],
    icon: "📋",
  },
  {
    id: "reports-analytics",
    title: "Reports & Analytics",
    bullets: [
      "Team productivity dashboards",
      "Payroll & department insights",
      "Leave usage statistics",
    ],
    icon: "📊",
  },
  {
    id: "notifications",
    title: "Notifications & Communication",
    bullets: [
      "Company-wide announcements",
      "Email / SMS alerts",
      "Basic internal chat",
    ],
    icon: "🔔",
  },
];

export default function ServicesHRMS() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-8 py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="HR Services Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl w-full">
        {/* Heading */}
        <div className="mb-16">
          <p className="text-sm font-semibold text-indigo-400 tracking-wider uppercase">
            Our Solutions
          </p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
            Professional HRMS Services
          </h2>
          <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto">
            End-to-end HR management system to simplify employee lifecycle,
            payroll, and productivity tracking with modern tools.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, index) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.15,
                duration: 0.6,
                ease: "easeOut",
              }}
              whileHover={{ scale: 1.05 }}
              className="relative flex flex-col rounded-xl bg-white/90 backdrop-blur-lg p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 text-left"
            >
              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-3xl text-white shadow-lg">
                {s.icon}
              </div>

              {/* Title */}
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                {s.title}
              </h3>

              {/* Bullets */}
              <ul className="mt-4 space-y-2 text-slate-600 text-sm">
                {s.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">✔</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Tag */}
              <div className="mt-auto pt-6">
                <span className="inline-block rounded-full px-3 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700">
                  Core Module
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}