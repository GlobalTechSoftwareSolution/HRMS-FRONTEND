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

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        {/* Logo & About */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
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
          <p className="text-sm text-gray-300 leading-relaxed">
            A modern Human Resource Management System to manage employees,
            payroll, and productivity — designed for growing businesses.
          </p>

          {/* Social Media Icons */}
          <div className="flex items-center gap-4 mt-4">
            <a
              href="https://www.instagram.com/globaltechsoftwaresolutions00/?next=%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-pink-500 transition-colors"
            >
              <Instagram size={24} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61576624472044"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-500 transition-colors"
            >
              <Facebook size={24} />
            </a>
            <a
              href="https://www.youtube.com/@Globaltech-softwaresolutions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-red-600 transition-colors"
            >
              <Youtube size={24} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-indigo-300">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm">
            {["Home", "About", "Services", "Contact", "Careers"].map((link, i) => (
              <li key={i}>
                <a
                  href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                  className="relative inline-block group"
                >
                  <span className="transition-all duration-300 group-hover:text-white">
                    {link}
                  </span>
                  <span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-indigo-300">
            Contact
          </h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Mail size={20} className="text-indigo-400 mt-1" />
              <a
                href="mailto:hrglobaltechsoftwaresolutions@gmail.com"
                className="hover:text-white transition md:ml-5"
              >
                hrglobaltechsoftwaresolutions@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={20} className="text-indigo-400 mt-1" />
              <a
                href="tel:+919844281875"
                className="hover:text-white transition"
              >
                +91 98442 81875
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
              <span>
                No 10, 4th Floor, Gaduniya Complex, Ramaiah Layout,
                Vidyaranyapura, Bangalore - 560097
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/20 mt-8 py-5 text-center text-xs text-gray-400">
        ©️ {new Date().getFullYear()} HRMS. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;