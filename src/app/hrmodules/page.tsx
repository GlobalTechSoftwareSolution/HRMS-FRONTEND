"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Easing, Variants } from "framer-motion";
import Image from "next/image";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  Users,
  Search,
  UserCheck,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Sparkles
} from "lucide-react";

const HRModulesCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const modules = [
    {
      label: "Attendance",
      link: "/contact/",
      icon: UserCheck,
      color: "from-blue-500 to-cyan-500",
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
      image: "/images/photo1.avif",
    },
    {
      label: "Recruitment",
      link: "/contact/",
      icon: Search,
      color: "from-green-500 to-emerald-500",
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
      image: "/images/photo2.avif",
    },
    {
      label: "Employee",
      link: "/contact/",
      icon: Users,
      color: "from-purple-500 to-pink-500",
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
      image: "/images/photo3.avif",
    },
    {
      label: "Payroll",
      link: "/contact/",
      icon: DollarSign,
      color: "from-orange-500 to-red-500",
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
      image: "/images/photo6.avif",
    },
    {
      label: "Performance",
      link: "/contact/",
      icon: TrendingUp,
      color: "from-indigo-500 to-blue-500",
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
      image: "/images/photo5.avif",
    },
    {
      label: "Training",
      link: "/contact/",
      icon: GraduationCap,
      color: "from-teal-500 to-green-500",
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
      image: "/images/photo4.avif",
    },
  ];

  const totalItems = modules.length;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-slide with pause on hover
  useEffect(() => {
    if (!isPlaying || isHovering) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying, isHovering, totalItems]);

  // Framer Motion variants, fully TypeScript-safe
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // stagger children safely
      },
    },
  };

  const customEase: Easing = [0.42, 0, 0.58, 1]; // cubic-bezier easing

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: customEase,
      },
    },
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-20 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200 mb-6"
          >
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Complee HR Solution</span>
          </motion.div>
          
          <h4 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            All the modules you need in{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              one platform
            </span>
          </h4>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your HR processes with our comprehensive suite of integrated modules
          </p>
        </motion.div>

        {/* Main Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Carousel */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white/80 backdrop-blur-sm border border-white/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="flex flex-col lg:flex-row gap-8 p-8 md:p-12 min-h-[500px]"
              >
                {/* Left Content */}
                <div className="flex-1 flex flex-col justify-center space-y-8">
                  {/* Module Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 mb-2"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`p-3 rounded-xl bg-gradient-to-r ${modules[currentIndex].color} shadow-lg`}
                    >
                      {/* <modules[currentIndex].icon className="w-6 h-6 text-white" /> */}
                    </motion.div>
                    <motion.span 
                      className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      {modules[currentIndex].link ? (
                        <a href={modules[currentIndex].link} className="flex items-center gap-2">
                          {modules[currentIndex].label}
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="flex items-center gap-2">
                          {modules[currentIndex].label}
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      )}
                    </motion.span>
                  </motion.div>

                  {/* Features List */}
                  <motion.ul 
                    className="space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {modules[currentIndex].features.map((f, i) => (
                      <motion.li
                        key={i}
                        variants={itemVariants}
                        whileHover={{ x: 10 }}
                        className="group cursor-pointer"
                      >
                        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-all">
                          <motion.div
                            className={`w-3 h-3 rounded-full mt-2 bg-gradient-to-r ${modules[currentIndex].color} group-hover:scale-125 transition-transform`}
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                              {f.title}
                            </h3>
                            <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                              {f.desc}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>

                  {/* CTA Button */}
                  {modules[currentIndex].link ? (
                    <motion.a
                      href={modules[currentIndex].link}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="inline-flex items-center gap-2 mt-4 text-blue-600 font-bold text-lg hover:text-blue-700 transition-colors group"
                    >
                      Explore {modules[currentIndex].label} Module
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.div>
                    </motion.a>
                  ) : (
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="inline-flex items-center gap-2 mt-4 text-blue-600 font-bold text-lg group"
                    >
                      Explore {modules[currentIndex].label} Module
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.div>
                    </motion.span>
                  )}
                </div>

                {/* Right Image */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, rotateY: 10 }}
                  animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
                    >
                      <Image
                        src={modules[currentIndex].image}
                        alt={`${modules[currentIndex].label} module`}
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                      />
                    </motion.div>
                    
                    {/* Floating Badge */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
                    >
                      New
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {currentIndex + 1}/{totalItems}
              </span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 shadow hover:bg-gray-50 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                key={currentIndex}
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentIndex + 1) / totalItems) * 100}%`,
                }}
                transition={{ duration: 0.6 }}
                className={`h-full bg-gradient-to-r ${modules[currentIndex].color} rounded-full`}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <motion.button
              onClick={handlePrev}
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-blue-600 shadow-xl hover:shadow-2xl border border-gray-200 hover:bg-blue-50 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-blue-600 shadow-xl hover:shadow-2xl border border-gray-200 hover:bg-blue-50 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-3 mt-6">
            {modules.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex 
                    ? `bg-gradient-to-r ${modules[currentIndex].color} scale-125` 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HRModulesCarousel;