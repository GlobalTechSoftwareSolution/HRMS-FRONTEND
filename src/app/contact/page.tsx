"use client";
import React, { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/footer";
import ContactFormClient from "@/components/ContactFormClient";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 text-black flex flex-col items-center px-4 py-16">
        {/* Header Section */}
        <section className="text-center mb-12 max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Get in <span className="text-blue-600">Touch</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Have questions or want to discuss a project? We&apos;re here to help and answer any questions you might have.
          </p>
        </section>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-10 w-full max-w-6xl">
          {/* Contact Info Card */}
          <section className="bg-white shadow-lg rounded-2xl p-8 lg:w-2/5">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
            <p className="text-gray-600 mb-6">
              Fill out the form or contact us through alternative methods listed below
            </p>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-700 font-semibold">Email</h3>
                  <a href="mailto:hrglobaltechsoftwaresolutions@gmail.com" className="text-blue-600 hover:underline">
                    hrglobaltechsoftwaresolutions@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-700 font-semibold">Phone</h3>
                  <a href="tel:+919844281875" className="text-green-600 hover:underline">
                    +91 98442 81875
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-full flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-700 font-semibold">Address</h3>
                  <p className="text-gray-600">
                    No 10, 4th Floor, Gaduniya Complex, Ramaiah Layout, Vidyaranyapura, Bangalore - 560097
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form - Wrapped in Suspense */}
          <Suspense fallback={<div className="bg-white shadow-lg rounded-2xl p-8 lg:w-3/5 flex items-center justify-center">
            <p>Loading form...</p>
          </div>}>
            <ContactFormClient />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}