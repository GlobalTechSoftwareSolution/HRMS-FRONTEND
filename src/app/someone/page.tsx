"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Clock, 
  Calculator, 
  FileText, 
  MapPin, 
  Camera,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";

type FeatureProps = {
  imgSrc: string;
};

const AttendanceFeature: React.FC<FeatureProps> = ({ imgSrc }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, threshold: 0.1 });
  const controls = useAnimation();

  const features = [
    {
      icon: Camera,
      title: "Face Attendance",
      description: "AI-powered facial recognition for secure and quick check-ins",
      color: "from-blue-500 to-cyan-500",
      delay: 0.1
    },
    {
      icon: Calculator,
      title: "Complete Payroll Solution",
      description: "End-to-end payroll processing with automated calculations",
      color: "from-green-500 to-emerald-500",
      delay: 0.2
    },
    {
      icon: FileText,
      title: "Digital Salary Slips",
      description: "Automated generation and distribution of salary slips",
      color: "from-purple-500 to-pink-500",
      delay: 0.3
    },
    {
      icon: Clock,
      title: "Real-time Attendance Data",
      description: "Live tracking and monitoring of employee attendance",
      color: "from-orange-500 to-red-500",
      delay: 0.4
    },
    {
      icon: Shield,
      title: "Automated PF, ESI Calculation",
      description: "Compliant statutory calculations and deductions",
      color: "from-indigo-500 to-blue-500",
      delay: 0.5
    },
    {
      icon: MapPin,
      title: "Selfie & Location Attendance",
      description: "Geofenced attendance with photo verification",
      color: "from-teal-500 to-green-500",
      delay: 0.6
    }
  ];

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const imageVariants = {
    hidden: { scale: 0.8, opacity: 0, rotateY: -15 },
    visible: {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      transition: {
        duration: 1,
        ease: "easeOut"
      }
    }
  };

  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
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
          className="absolute top-60 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
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
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 60, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={floatingAnimation}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200 mb-6"
          >
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Next Generation Workforce Management</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
            Switch to 
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Global Tech Software Solutions
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Revolutionize your workforce management with our AI-powered attendance 
            and payroll platform designed for the modern enterprise.
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="flex flex-col lg:flex-row items-center justify-between gap-16"
        >
          {/* Image Section */}
          <motion.div
            variants={imageVariants}
            className="flex-1 relative"
          >
            <div className="relative">
              {/* Main Image Container */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative z-10"
              >
                <Image
                  src='/images/blog.jpg'
                  alt="Global Tech Software Solutions"
                  width={500}
                  height={700}
                  className="rounded-3xl shadow-2xl border-8 border-white object-cover w-full max-w-md mx-auto"
                />
              </motion.div>
              
              {/* Floating Elements */}
              <motion.div
                animate={floatingAnimation}
                className="absolute -top-6 -left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-gray-200 z-20"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-800">98% Accuracy</span>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  ...floatingAnimation,
                  y: [-15, 5, -15]
                }}
                className="absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-gray-200 z-20"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-semibold text-gray-800">100% Secure</span>
                </div>
              </motion.div>

              {/* Background Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl -z-10"
              />
            </div>
          </motion.div>

          {/* Features Section */}
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    y: -5,
                    transition: { type: "spring", stiffness: 400 }
                  }}
                  className="group relative"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 h-full">
                    <div className="flex items-start gap-4">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg group-hover:shadow-xl transition-shadow`}
                      >
                        <feature.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gray-800 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Effect Line */}
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12 text-center"
            >
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r mt-10 from-blue-600 to-purple-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto group"
              >
                
                <Link href='/login'>Get Started Today</Link>

                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </motion.button>
              
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AttendanceFeature;