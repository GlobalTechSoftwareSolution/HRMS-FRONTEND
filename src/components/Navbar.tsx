"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, User, Mail, LogIn, FileText, Users } from "lucide-react";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { id: "home", label: "Home", href: "/", icon: <Home size={18} /> },
    { id: "about", label: "About", href: "/about", icon: <User size={18} /> },
    { id: "contact", label: "Contact", href: "/contact", icon: <Mail size={18} /> },
    { id: "blogs", label: "Blogs", href: "/blogs", icon: <FileText size={18} /> },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 shadow-lg sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 cursor-pointer ml-2 lg:ml-4 flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src="/logo/Global.jpg"
                alt="HRMS Logo"
                width={70}
                height={70}
                className="rounded-full shadow-lg border-2 border-white/20 object-cover"
              />
            </motion.div>
            <motion.span
              className="text-white text-2xl font-bold bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              HRMS
            </motion.span>
          </Link>

          {/* Desktop Menu - Only show on lg screens and above */}
          <div className="hidden lg:flex items-center justify-end flex-1 mr-8">
            <ul className="flex space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <motion.li key={link.id} className="relative" whileHover={{ y: -2 }}>
                    <Link
                      href={link.href}
                      className={`relative flex items-center space-x-2 text-white px-5 py-2.5 font-medium transition-colors duration-300 rounded-lg`}
                    >
                      <motion.span
                        animate={{
                          scale: isActive ? 1.1 : 1,
                          color: isActive ? "#e0e7ff" : "white",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {link.icon}
                      </motion.span>
                      <span>{link.label}</span>

                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-white/10 rounded-lg -z-10"
                          layoutId="activeNavLink"
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
              <motion.li className="relative" whileHover={{ y: -2 }}>
                <Link
                  href="/facescan"
                  className="relative flex items-center space-x-2 text-white px-5 py-2.5 font-medium transition-colors duration-300 rounded-lg"
                >
                  <motion.span
                    animate={{
                      scale: 1,
                      color: "white",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Users size={18} />
                  </motion.span>
                  <span>Attendance</span>
                </Link>
              </motion.li>
            </ul>

            {/* Login Button */}
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/login"
                className="ml-4 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg flex items-center space-x-2 transition-all duration-300"
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button - Show on all screens except lg and above */}
          <motion.button
            onClick={toggleMenu}
            className="lg:hidden text-white focus:outline-none p-1 rounded-lg bg-white/10"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={28} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={28} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Dropdown - Show on all screens except lg and above */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden bg-white/95 backdrop-blur-sm rounded-b-xl shadow-xl overflow-hidden"
            >
              <ul className="flex flex-col p-2">
                {navLinks.map((link, index) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.li
                      key={link.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                      }}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <Link
                        href={link.href}
                        className={`flex items-center space-x-3 text-gray-800 px-6 py-4 font-medium transition-all duration-300 rounded-lg hover:bg-indigo-50`}
                        onClick={() => setIsOpen(false)}
                      >
                        <motion.span
                          animate={{
                            scale: isActive ? 1.2 : 1,
                            color: isActive ? "#4f46e5" : "#4b5563",
                          }}
                        >
                          {link.icon}
                        </motion.span>
                        <span>{link.label}</span>

                        {isActive && (
                          <motion.div
                            className="ml-auto w-2 h-2 bg-indigo-500 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          />
                        )}
                      </Link>
                    </motion.li>
                  );
                })}
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1, type: "spring", stiffness: 100 }}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <Link
                    href="/facescan"
                    className="flex items-center space-x-3 text-gray-800 px-6 py-4 font-medium transition-all duration-300 rounded-lg hover:bg-indigo-50 w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <motion.span
                      animate={{
                        scale: 1,
                        color: "#4b5563",
                      }}
                    >
                      <Users size={18} />
                    </motion.span>
                    <span>Attendance</span>
                  </Link>
                </motion.li>

                {/* Mobile Login Button */}
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + 1) * 0.1, type: "spring", stiffness: 100 }}
                  className="mt-2 px-6 py-4"
                >
                  <Link
                    href="/login"
                    className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-all duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>
                </motion.li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

    </>
  );
};