"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HRModulesCarousel: React.FC = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const modules = [
    {
      label: "Attendance",
      link: "/docs/attendance/",
      features: [
        {
          title: "Efficient Attendance Management",
          desc: "Streamline employee attendance with automated check-in/out feature.",
        },
        {
          title: "Biometric Integration",
          desc: "Precise attendance tracking with biometric device integration.",
        },
        {
          title: "Overtime Calculation",
          desc: "Accurately calculates overtime hours for proper compensation.",
        },
      ],
      image:
        "/images/photo1.avif",
    },
    {
      label: "Recruitment",
      link: "/docs/recruitment/",
      features: [
        {
          title: "Manage Recruitment Easily",
          desc: "Simplify recruitment with an intuitive UI for candidate management.",
        },
        {
          title: "Identify Potential Candidates",
          desc: "Smart insights to evaluate candidates' strengths and weaknesses.",
        },
        {
          title: "Manage Recruitment Flow",
          desc: "Control your recruitment stages with prioritization.",
        },
      ],
      image:
        "/images/photo2.avif",
    },
    {
      label: "Employee",
      link: "/docs/employee/",
      features: [
        {
          title: "Employee Directory and Information Management",
          desc: "Centralized employee management with LDAP integration.",
        },
        {
          title: "Personal Information Management",
          desc: "Securely manage employee data with easy access for HR.",
        },
        {
          title: "Work Information Tracking",
          desc: "Track employee roles, departments, and statuses efficiently.",
        },
      ],
      image:
        "/images/photo3.avif",
    },
    {
      label: "Payroll",
      link: "/docs/payroll/",
      features: [
        {
          title: "Automated Salary Processing",
          desc: "Save time with fully automated payroll calculations.",
        },
        {
          title: "Tax & Compliance",
          desc: "Stay compliant with built-in tax & compliance management.",
        },
        {
          title: "Payslip Generation",
          desc: "Instant payslip generation and employee self-service access.",
        },
      ],
      image:
        "/images/photo6.avif",
    },
    {
      label: "Performance",
      link: "/docs/performance/",
      features: [
        {
          title: "Track Goals & KPIs",
          desc: "Monitor progress with transparent performance metrics.",
        },
        {
          title: "360-Degree Feedback",
          desc: "Encourage collaboration with peer & manager feedback.",
        },
        {
          title: "Performance Reviews",
          desc: "Structured review system for continuous growth.",
        },
      ],
      image:
        "/images/photo5.avif",
    },
    {
      label: "Training",
      link: "/docs/training/",
      features: [
        {
          title: "Learning Management",
          desc: "Centralized training and e-learning resources.",
        },
        {
          title: "Skill Tracking",
          desc: "Track employee learning paths and certifications.",
        },
        {
          title: "Custom Training Plans",
          desc: "Design role-specific training for better outcomes.",
        },
      ],
      image:
        "/images/photo4.avif",
    },
  ];

  const totalItems = modules.length;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, 6000);
    return () => clearInterval(interval);
  }, [totalItems]);

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 relative bg-[#f9fafb]">
      <h4 className="text-3xl font-bold text-center mb-12 text-gray-900">
        All the modules you'll ever need in{" "}
        <span className="text-blue-600">one software</span>.
      </h4>

      {/* Carousel */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex flex-col md:flex-row gap-8 p-8 min-h-[400px]"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md">
                  <a href={modules[currentIndex].link}>
                    {modules[currentIndex].label}
                  </a>
                </span>
              </motion.div>

              <ul className="space-y-6">
                {modules[currentIndex].features.map((f, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                      {f.title}
                    </h3>
                    <p className="text-gray-600 ml-6 text-sm">{f.desc}</p>
                  </motion.li>
                ))}
              </ul>

              <a
                href={modules[currentIndex].link}
                className="inline-flex items-center mt-6 text-blue-600 font-semibold hover:text-blue-700 transition"
              >
                Explore More →
              </a>
            </div>

            {/* Right Image */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 hover:scale-[1.02] transition-transform duration-500">
                <img
                  src={modules[currentIndex].image}
                  alt={`${modules[currentIndex].label} module`}
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Counter + Progress Bar */}
      <div className="text-center mt-6 text-gray-700 font-medium">
        {currentIndex + 1}/{totalItems}
      </div>
      <div className="h-2 bg-gray-200 rounded mt-3 max-w-md mx-auto overflow-hidden">
        <motion.div
          key={currentIndex}
          initial={{ width: 0 }}
          animate={{
            width: `${((currentIndex + 1) / totalItems) * 100}%`,
          }}
          transition={{ duration: 0.6 }}
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-6 mt-8">
        <button
          onClick={handlePrev}
          aria-label="Go to previous slide"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-blue-500 shadow hover:bg-blue-500 hover:text-white transition"
        >
          ‹
        </button>
        <button
          onClick={handleNext}
          aria-label="Go to next slide"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-blue-500 shadow hover:bg-blue-500 hover:text-white transition"
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default HRModulesCarousel;
