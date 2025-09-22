"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Search, X, Filter } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: "What is an HR Management System?",
    answer:
      "An HR Management System is a comprehensive platform that helps manage employee data, payroll, attendance, recruitment, performance, and more in one centralized place. It streamlines HR processes, reduces paperwork, and improves efficiency.",
    category: "General",
  },
  {
    id: 2,
    question: "Is my data secure?",
    answer:
      "Yes. Our system uses enterprise-grade encryption, secure authentication methods, and regular security audits to ensure your data is protected. We comply with industry standards and regulations to maintain the highest level of data security.",
    category: "Security",
  },
  {
    id: 3,
    question: "Can I integrate it with biometric devices?",
    answer:
      "Absolutely! Our system integrates seamlessly with most biometric devices for attendance and access management. We support integration with various brands and can provide guidance on compatible devices.",
    category: "Integration",
  },
  {
    id: 4,
    question: "Do employees get self-service access?",
    answer:
      "Yes, employees can log in to a dedicated portal to view payslips, attendance records, leave balances, update personal information, request time off, and access company documents.",
    category: "Features",
  },
  {
    id: 5,
    question: "Is the system customizable?",
    answer:
      "Yes, the system is highly customizable to match your company's policies, workflow, and branding. We offer configuration options and can develop custom features to meet your specific needs.",
    category: "Customization",
  },
  {
    id: 6,
    question: "How often do you update the system?",
    answer:
      "We release regular updates every month with new features, security patches, and performance improvements. Major updates are rolled out quarterly with significant enhancements.",
    category: "General",
  },
  {
    id: 7,
    question: "What kind of support do you offer?",
    answer:
      "We provide 24/7 customer support via email, chat, and phone. Our support team is trained to handle technical issues, answer questions, and guide you through any challenges you might face.",
    category: "Support",
  },
  {
    id: 8,
    question: "Can I try the system before purchasing?",
    answer:
      "Yes, we offer a 14-day free trial with full access to all features. No credit card is required to start the trial, and our team will guide you through the setup process.",
    category: "General",
  },
];

const categories = ["All", ...new Set(faqs.map(faq => faq.category))];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <section className="max-w-4xl mx-auto py-16 px-4 text-black bg-[#f0f9ff]">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
        Frequently Asked Questions
      </h2>

      <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
        Find answers to common questions about our HR Management System.{" "}
        Can&apos;t find what you&apos;re looking for?{" "}
        <a href="#" className="text-blue-600 hover:underline">
          Contact our support team
        </a>
        .
      </p>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search questions..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="relative w-full md:w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 text-sm text-gray-600">
        {filteredFaqs.length} {filteredFaqs.length === 1 ? "result" : "results"} found
        {(searchQuery || selectedCategory !== "All") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="ml-2 text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-medium text-gray-800 hover:bg-gray-50 transition"
                aria-expanded={openIndex === faq.id}
                aria-controls={`answer-${faq.id}`}
              >
                <div className="flex items-start">
                  <span className="text-blue-600 font-semibold mr-3">Q:</span>
                  <span className="text-lg">{faq.question}</span>
                </div>
                {openIndex === faq.id ? (
                  <ChevronUp className="w-6 h-6 text-blue-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500 flex-shrink-0" />
                )}
              </button>

              {/* Answer with animation */}
              <AnimatePresence initial={false}>
                {openIndex === faq.id && (
                  <motion.div
                    id={`answer-${faq.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-gray-600 text-base leading-relaxed">
                      <span className="text-green-600 font-semibold mr-2">A:</span>
                      {faq.answer}
                    </div>
                    <div className="px-6 pb-4">
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {faq.category}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-2xl shadow border border-gray-100">
            <p className="text-gray-600 mb-2">No results found for your search.</p>
            <p className="text-gray-500 text-sm">Try different keywords or categories</p>
          </div>
        )}
      </div>

      {/* Contact CTA */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Still have questions?</h3>
        <p className="text-gray-600 mb-4">
          Our support team is here to help you get the answers you need.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
          <Link href="/contact">Contact Support</Link>
        </button>
      </div>
    </section>
  );
};

export default FAQSection;
