// src/pages/HRMSBlog.tsx
"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/footer";

const HRMSBlog: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 py-12 px-6 md:px-24">
        <article className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 md:p-16 transition-transform transform hover:scale-105 hover:shadow-2xl duration-500">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-800 mb-6 animate-fadeIn">
            The Ultimate Guide to HRMS: Transforming Human Resource Management
          </h1>

          <p className="text-gray-700 mb-6 text-lg leading-relaxed animate-fadeIn delay-100">
            In today’s fast-paced business environment, managing human resources efficiently is more critical than ever. Enter <strong className="text-indigo-600">HRMS – Human Resource Management System</strong>, a powerful software solution designed to streamline HR processes, improve employee engagement, and drive organizational growth.
          </p>

          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 mt-8 animate-fadeIn delay-200">
            What is HRMS?
          </h2>
          <p className="text-gray-700 mb-6 animate-fadeIn delay-300">
            A <strong>Human Resource Management System (HRMS)</strong> is an integrated software platform that automates and manages HR functions such as payroll, recruitment, attendance, performance evaluation, employee onboarding, and more. By centralizing these processes, HRMS allows HR teams to focus on strategic planning rather than tedious administrative tasks.
          </p>

          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 mt-8 animate-fadeIn delay-400">
            Key Features of HRMS
          </h2>
          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2 animate-fadeIn delay-500">
            <li><strong>Employee Information Management:</strong> Store all employee data securely. Access records instantly.</li>
            <li><strong>Payroll Management:</strong> Automate salary, deductions, and generate pay slips.</li>
            <li><strong>Attendance and Leave Tracking:</strong> Track attendance in real time and manage leaves seamlessly.</li>
            <li><strong>Recruitment and Onboarding:</strong> Simplify hiring from application to onboarding.</li>
            <li><strong>Performance Management:</strong> Set goals, monitor progress, and conduct appraisals efficiently.</li>
            <li><strong>Self-Service Portals:</strong> Empower employees to manage their own data and requests.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 mt-8 animate-fadeIn delay-600">
            Benefits of Implementing HRMS
          </h2>
          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2 animate-fadeIn delay-700">
            <li><strong>Efficiency and Accuracy:</strong> Automates repetitive HR tasks, reducing errors.</li>
            <li><strong>Better Decision-Making:</strong> Real-time data for strategic workforce planning.</li>
            <li><strong>Compliance Management:</strong> Keeps track of labor laws, taxes, and statutory requirements.</li>
            <li><strong>Employee Satisfaction:</strong> Streamlines processes, improving experience.</li>
            <li><strong>Cost Savings:</strong> Reduces paperwork and operational inefficiencies.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 mt-8 animate-fadeIn delay-800">
            Choosing the Right HRMS
          </h2>
          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2 animate-fadeIn delay-900">
            <li><strong>Scalability:</strong> Can it grow with your business?</li>
            <li><strong>Integration:</strong> Does it work well with existing systems?</li>
            <li><strong>User Experience:</strong> Is it intuitive for both HR teams and employees?</li>
            <li><strong>Customization:</strong> Can it adapt to your company’s unique processes?</li>
          </ul>

          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 mt-8 animate-fadeIn delay-1000">
            Conclusion
          </h2>
          <p className="text-gray-700 animate-fadeIn delay-1100">
            An effective HRMS transforms the way businesses manage their human capital. By automating routine tasks, improving data accuracy, and empowering employees, it becomes a cornerstone of organizational efficiency and growth. Whether you’re a startup or an enterprise, investing in a robust HRMS can unlock the full potential of your workforce.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
};

export default HRMSBlog;
