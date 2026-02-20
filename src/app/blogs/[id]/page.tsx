"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin, MessageSquare } from "lucide-react";
import { useParams } from "next/navigation";

const blogPosts = [
    {
        id: 1,
        title: "The Ultimate Guide to HRMS: Transforming Management",
        category: "Technology",
        date: "Feb 15, 2026",
        readTime: "8 min",
        author: "Rohini Hatti",
        image: "https://images.unsplash.com/photo-1454165833767-027ffea10c3b?auto=format&fit=crop&q=80&w=1000",
        content: `
      <p className="text-xl text-gray-700 leading-relaxed mb-8 font-medium italic border-l-4 border-blue-500 pl-6 bg-blue-50 py-4 rounded-r-xl">
        In today’s fast-paced business environment, managing human resources efficiently is more critical than ever. HRMS software solutions are transforming the way companies handle their most valuable asset: their people.
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">What is HRMS?</h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        A Human Resource Management System (HRMS) is an integrated software platform that automates and manages HR functions such as payroll, recruitment, attendance, performance evaluation, employee onboarding, and more. By centralizing these processes, HRMS allows HR teams to focus on strategic planning rather than tedious administrative tasks.
      </p>

      <div className="my-10 overflow-hidden rounded-3xl shadow-xl">
        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000" alt="Tech Dashboard" className="w-full h-auto" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">Key Features of HRMS</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <li className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <strong className="text-blue-600 block mb-1">Employee Info Management</strong> Store all employee data securely and access records instantly.
        </li>
        <li className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <strong className="text-blue-600 block mb-1">Payroll Management</strong> Automate salary, deductions, and generate pay slips without errors.
        </li>
        <li className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <strong className="text-blue-600 block mb-1">Attendance Tracking</strong> Track attendance in real time and manage leaves seamlessly via mobile.
        </li>
        <li className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <strong className="text-blue-600 block mb-1">Self-Service Portals</strong> Empower employees to manage their own data and requests easily.
        </li>
      </ul>

      <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">Benefits of Implementation</h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        Implementing a robust HRMS isn't just about software; it's about changing organizational culture. It creates transparency, ensures compliance with ever-changing labor laws, and provides real-time data for better decision-making.
      </p>

      <div className="bg-indigo-900 rounded-[2rem] p-8 md:p-12 my-12 text-white">
        <h3 className="text-2xl font-bold mb-4">"HRMS is the backbone of the modern digital workplace."</h3>
        <p className="opacity-80">– Chief Talent Officer, Global Tech Solutions</p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">Conclusion</h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        Whether you’re a startup or an enterprise, investing in a robust HRMS can unlock the full potential of your workforce. It transforms routine tasks into efficient workflows, allowing your team to focus on what truly matters: growth and innovation.
      </p>
    `
    },
    // Add other posts as needed
];

export default function BlogPostDetail() {
    const params = useParams();
    const id = Number(params.id);

    // Find the post, or default to the first one if not found for demo
    const post = blogPosts.find(p => p.id === id) || blogPosts[0];

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-white">
                {/* Article Header */}
                <header className="relative py-20 bg-gray-50 border-b border-gray-100 overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-500/5 -skew-x-12 transform translate-x-20"></div>

                    <div className="max-w-4xl mx-auto px-6 relative z-10">
                        <Link href="/blogs" className="inline-flex items-center text-blue-600 font-bold mb-8 hover:gap-2 transition-all">
                            <ArrowLeft size={20} className="mr-2" /> Back to Blogs
                        </Link>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                                {post.category}
                            </span>
                            <span className="text-gray-400 font-medium">•</span>
                            <span className="text-gray-500 font-medium flex items-center gap-1.5 uppercase text-xs tracking-widest">
                                <Clock size={14} /> {post.readTime} Read
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 tracking-tight leading-[1.1]">
                            {post.title}
                        </h1>
                        <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-gray-200/60">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200">
                                    {post.author.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-gray-900 font-bold text-lg">{post.author}</p>
                                    <p className="text-gray-500 text-sm font-medium flex items-center gap-1.5">
                                        <Calendar size={14} className="text-blue-500 outline-none" /> {post.date}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 font-bold mr-2 uppercase text-xs tracking-widest">Share:</span>
                                <button className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">
                                    <Facebook size={18} />
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-400 hover:text-white hover:border-blue-400 transition-all shadow-sm">
                                    <Twitter size={18} />
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all shadow-sm">
                                    <Linkedin size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Featured Image */}
                <div className="max-w-5xl mx-auto px-6 -mt-12">
                    <div className="aspect-[21/9] w-full bg-gray-200 rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-white">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Article Content */}
                <main className="max-w-4xl mx-auto px-6 py-20">
                    <div className="prose prose-lg prose-indigo max-w-none">
                        {/* Using dangerouslySetInnerHTML for the mock content */}
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>

                    {/* Tags */}
                    <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap gap-3">
                        <span className="text-gray-400 font-bold mr-2 uppercase text-xs tracking-widest self-center">Tags:</span>
                        {["HRMS", "Digital Transformation", "Workplace", "Management"].map(tag => (
                            <span key={tag} className="px-5 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold border border-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* Author Box */}
                    <div className="mt-16 p-8 md:p-12 bg-gray-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full -ml-16 -mt-16"></div>
                        <div className="w-24 h-24 rounded-3xl bg-blue-600 flex flex-shrink-0 items-center justify-center text-3xl font-bold shadow-2xl relative z-10">
                            {post.author.charAt(0)}
                        </div>
                        <div className="relative z-10 text-center md:text-left">
                            <h3 className="text-2xl font-bold mb-2">Written by {post.author}</h3>
                            <p className="text-blue-200 leading-relaxed mb-6 opacity-80">
                                A specialist in modern HR technologies and management systems with over 10 years of experience in the SaaS industry. Passionate about building tools that empower employees.
                            </p>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <Link href="/about" className="text-white font-bold border-b-2 border-blue-500 pb-1 hover:text-blue-300 transition-all">
                                    View Profile
                                </Link>
                                <span className="text-gray-500">•</span>
                                <Link href="/contact" className="text-white font-bold border-b-2 border-blue-500 pb-1 hover:text-blue-300 transition-all">
                                    Follow on Twitter
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
