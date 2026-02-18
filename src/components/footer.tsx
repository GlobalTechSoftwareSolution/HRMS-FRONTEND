// components/Footer.tsx
"use client";
import React from "react";
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube } from "lucide-react";
import Image from "next/image";

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-gray-200 mt-0 overflow-hidden">
      {/* Top animated glowing border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 animate-gradient-x" />

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
        {/* Logo & About */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image
              src="/logo/Global.jpg"
              alt="HRMS Logo"
              width={55}
              height={55}
              className="rounded-full shadow-md border border-white/20"
            />
            <span className="text-2xl font-extrabold tracking-tight text-white">
              HRMS
            </span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
            A modern Human Resource Management System to manage employees,
            payroll, and productivity — designed for growing businesses.
          </p>

          {/* Social Media Icons */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <a
              href="https://www.instagram.com/globaltechsoftwaresolutions00/?next=%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-pink-500 transition-all hover:scale-110"
            >
              <Instagram size={26} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61576624472044"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-500 transition-all hover:scale-110"
            >
              <Facebook size={26} />
            </a>
            <a
              href="https://www.youtube.com/@Globaltech-softwaresolutions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-red-600 transition-all hover:scale-110"
            >
              <Youtube size={26} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <h3 className="text-xl font-bold mb-6 text-indigo-300">
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm">
            {["Home", "About", "Services", "Contact", "Careers"].map((link, i) => (
              <li key={i}>
                <a
                  href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                  className="relative inline-block group"
                >
                  <span className="transition-all duration-300 group-hover:text-white text-base">
                    {link}
                  </span>
                  <span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-bold mb-6 text-indigo-300">
            Contact
          </h3>
          <ul className="space-y-5 text-sm w-fit">
            <li>
              <a
                href="mailto:hrglobaltechsoftwaresolutions@gmail.com"
                className="flex items-center space-x-4 group"
              >
                <div className="bg-indigo-500/10 p-2.5 rounded-full text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 flex-shrink-0">
                  <Mail size={18} />
                </div>
                <span className="hover:text-white transition-colors text-base">
                  hrglobaltechsoftwaresolutions@gmail.com
                </span>
              </a>
            </li>
            <li>
              <a
                href="tel:+918495862494"
                className="flex items-center space-x-4 group"
              >
                <div className="bg-indigo-500/10 p-2.5 rounded-full text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 flex-shrink-0">
                  <Phone size={18} />
                </div>
                <span className="hover:text-white transition-colors text-base">
                  +91 8495862494
                </span>
              </a>
            </li>
            <li>
              <a
                href="https://www.google.com/maps/search/?api=1&query=No+10,+4th+Floor,+Gaduniya+Complex,+Ramaiah+Layout,+Vidyaranyapura,+Bangalore+-+560097"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start space-x-4 group"
              >
                <div className="bg-indigo-500/10 p-2.5 rounded-full text-indigo-400 mt-0.5 flex-shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                  <MapPin size={18} />
                </div>
                <span className="max-w-[280px] text-base leading-relaxed group-hover:text-white transition-colors">
                  No 10, 4th Floor, Gaduniya Complex, Ramaiah Layout,
                  Vidyaranyapura, Bangalore - 560097
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/20 mt-8 py-5 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} HRMS. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;