"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
          <h1 className="text-5xl font-bold mb-6 text-center">About HR Global Tech</h1>
          <p className="text-xl max-w-3xl text-center">
            Empowering businesses with innovative HR solutions since 2025
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="min-h-screen bg-gray-50">
        {/* Mission Section */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className={`bg-white rounded-xl shadow-lg p-10 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Mission</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                At HR Global Tech Software Solutions, we&apos;re dedicated to revolutionizing human resources management for businesses of all sizes. Our mission is to provide intuitive, powerful software solutions that transform how companies manage their most valuable asset: their people.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                By combining cutting-edge technology with deep HR expertise, we help organizations streamline processes, enhance employee engagement, and drive business growth through effective human capital management.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-6 bg-white">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="text-blue-600 text-4xl mb-4">✓</div>
                <h3 className="text-xl font-semibold mb-3 text-black">Innovation</h3>
                <p className="text-gray-600">We constantly push boundaries to develop forward-thinking solutions that address tomorrow&apos;s HR challenges today.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="text-blue-600 text-4xl mb-4">❤️</div>
                <h3 className="text-xl font-semibold mb-3 text-black">Integrity</h3>
                <p className="text-gray-600">We build trust through transparency, ethical practices, and unwavering commitment to our clients&apos; success.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="text-blue-600 text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-3 text-black">Efficiency</h3>
                <p className="text-gray-600">We design our solutions to simplify complex processes, saving time and resources while maximizing productivity.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-6 bg-white">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
              Leadership Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

              {/* CEO */}
              <div className="flex flex-col md:flex-row items-center md:items-start">
                <Image
                  src="/team/sharansir..jpg"
                  alt="Sharan Patil"
                  width={128}
                  height={128}
                  className="rounded-full object-cover mb-4 md:mb-0 md:mr-6"
                />
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-semibold text-black">Sharan Patil</h3>
                  <p className="text-blue-600 mb-3">CEO & Founder</p>
                  <p className="text-gray-600">
                    With over 8 years in HR technology, HR Global Tech bridges the gap
                    between HR needs and technological solutions.
                  </p>
                </div>
              </div>

              {/* Tech Lead */}
              <div className="flex flex-col md:flex-row items-center md:items-start">
                <Image
                  src="/team/rohini.png"
                  alt="Rohini Hatti"
                  width={128}
                  height={128}
                  className="rounded-full object-cover mb-4 md:mb-0 md:mr-6"
                />
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-semibold text-black">Rohini Hatti</h3>
                  <p className="text-blue-600 mb-3">Tech Lead</p>
                  <p className="text-gray-600">
                    Rohini leads our technical vision, ensuring our platforms
                    remain at the forefront of innovation, security, and scalability.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center md:items-start">
                <Image
                  src="/team/kaushik.jpg"
                  alt="J G Kaushik"
                  width={128}
                  height={128}
                  className="rounded-full object-cover mb-4 md:mb-0 md:mr-6"
                />
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-semibold text-black">JG Kaushik</h3>
                  <p className="text-blue-600 mb-3">Developer</p>
                  <p className="text-gray-600">
                    Kaushik transforms ideas into powerful digital solutions, modern technologies, and problem-solving expertise to deliver impactful results.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center md:items-start">
                <Image
                  src="/team/nithyaaa.png"
                  alt="Nithya M S"
                  width={128}
                  height={128}
                  className="rounded-full object-cover mb-4 md:mb-0 md:mr-6"
                />
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-semibold text-black">Nithya M S</h3>
                  <p className="text-blue-600 mb-3">Developer</p>
                  <p className="text-gray-600">
                    Nithya contributes to our technical efforts, helping ensure our platforms remain efficient, secure, and scalable.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-gray-100">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Ready to Transform Your HR Operations?</h2>
            <p className="text-gray-600 text-lg mb-8">
              Discover how HR Global Tech can streamline your HR processes, reduce administrative burden, and help you focus on strategic initiatives.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300">
              <Link href='/contact'>Request a Demo</Link>
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
