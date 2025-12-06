"use client";
import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/footer";

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ContactPage() {
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  // Auto-fill form from query parameters
  useEffect(() => {
    const name = searchParams.get('name') || "";
    const email = searchParams.get('email') || "";
    const phone = searchParams.get('phone') || "";
    const message = searchParams.get('message') || "";
    
    if (name || email || phone || message) {
      setFormData({
        name,
        email,
        phone,
        message
      });
    }
  }, [searchParams]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPopupMessage(null); // Clear any previous messages
    
    try {
      // Send data directly to the backend API
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://hrms.globaltechsoftwaresolutions.cloud";
      
      if (!apiBase || apiBase === "undefined") {
        throw new Error("API configuration error. Please contact support.");
      }
      
      // Validate form data
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
        throw new Error("All fields are required. Please fill in all fields.");
      }
      
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address.");
      }
      
      // Simple phone validation (at least 10 digits)
      const phoneRegex = /^\+?[0-9\s\-()]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        throw new Error("Please enter a valid phone number.");
      }
      
      // Remove the problematic ngrok header that causes CORS issues
      const response = await fetch(`${apiBase}/api/accounts/contact/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Removed "ngrok-skip-browser-warning" header which was causing CORS issues
        },
        body: JSON.stringify(formData),
      });
      
      // Check if the response is ok
      if (!response.ok) {
        let errorMessage = "Failed to send message. ";
        
        try {
          const errorData = await response.json();
          errorMessage += errorData.error || `Server responded with status ${response.status}`;
        } catch (parseError) {
          errorMessage += `Server responded with status ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Success
      setPopupMessage("Thank you for your message! We'll get back to you soon.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      console.error("Contact form error:", error);
      
      // Handle different types of errors
      let errorMessage = "There was an error sending your message. Please try again.";
      
      if (error instanceof TypeError) {
        // Network error (e.g., CORS, offline)
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPopupMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closePopup = () => setPopupMessage(null);

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

          {/* Contact Form Card */}
          <section className="bg-white shadow-lg rounded-2xl p-8 lg:w-3/5">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Your email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Your message..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </section>
        </div>
      </main>
      
      {/* Popup Modal */}
      {popupMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <p className="text-gray-800 mb-6">{popupMessage}</p>
            <button
              onClick={closePopup}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
}