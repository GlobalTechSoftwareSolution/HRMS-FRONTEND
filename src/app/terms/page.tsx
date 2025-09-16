"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Shield, FileText, Lock, Users, Cookie, Mail, AlertCircle, CheckCircle, PhoneCall } from "lucide-react";

const TermsPrivacy: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    terms: false,
    privacy: false,
    termsDetails: {},
    privacyDetails: {}
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSubSection = (parent: string, subsection: string) => {
    setOpenSections(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [subsection]: !prev[parent]?.[subsection]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Shield className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">HRMS Terms & Privacy Policy</h1>
          <p className="text-blue-100">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="p-8">
          {/* Introduction */}
          <div className="mb-10 text-center">
            <p className="text-gray-600 mb-6">
              Welcome to our HR Management System. Please read these terms and our privacy policy carefully before using our platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-700 font-medium">Comprehensive Terms</span>
              </div>
              <div className="flex items-center bg-indigo-50 px-4 py-2 rounded-lg">
                <Lock className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-indigo-700 font-medium">Data Protection</span>
              </div>
              <div className="flex items-center bg-purple-50 px-4 py-2 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-purple-700 font-medium">User Rights</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mb-10">
            <div 
              className="flex justify-between items-center cursor-pointer p-4 bg-blue-50 rounded-lg"
              onClick={() => toggleSection('terms')}
            >
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-blue-800">Terms & Conditions</h2>
              </div>
              {openSections.terms ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
            </div>

            {openSections.terms && (
              <div className="mt-4 pl-2 border-l-4 border-blue-200 ml-3">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Acceptance of Terms
                  </h3>
                  <p className="text-gray-600 ml-7">
                    By accessing or using the HRMS platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. 
                    If you do not agree with any part of these terms, you must not use our services.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    User Accounts
                  </h3>
                  <p className="text-gray-600 ml-7">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. 
                    Immediately notify us of any unauthorized use of your account or any other security breaches.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Appropriate Use
                  </h3>
                  <p className="text-gray-600 ml-7">
                    The HRMS platform is intended for legitimate human resources management purposes only. You agree not to misuse the platform, including but not limited to:
                  </p>
                  <ul className="text-gray-600 ml-12 list-disc mt-2">
                    <li>Uploading or sharing inappropriate content</li>
                    <li>Attempting to compromise system security</li>
                    <li>Using the platform for unauthorized purposes</li>
                    <li>Violating any applicable laws or regulations</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Intellectual Property
                  </h3>
                  <p className="text-gray-600 ml-7">
                    All content, features, and functionality of the HRMS platform, including but not limited to text, graphics, logos, and software, are the exclusive property of the company and are protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Limitation of Liability
                  </h3>
                  <p className="text-gray-600 ml-7">
                    To the fullest extent permitted by law, the company shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, whether in an action in contract, tort, or otherwise, arising out of or in any way connected with the use of our platform.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Changes to Terms
                  </h3>
                  <p className="text-gray-600 ml-7">
                    We reserve the right to modify these terms at any time. We will provide notice of significant changes through our platform or via email. Continued use of the platform after changes constitutes acceptance of the modified terms.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Policy */}
          <div>
            <div 
              className="flex justify-between items-center cursor-pointer p-4 bg-indigo-50 rounded-lg"
              onClick={() => toggleSection('privacy')}
            >
              <div className="flex items-center">
                <Lock className="h-6 w-6 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-indigo-800">Privacy Policy</h2>
              </div>
              {openSections.privacy ? <ChevronUp className="h-5 w-5 text-indigo-600" /> : <ChevronDown className="h-5 w-5 text-indigo-600" />}
            </div>

            {openSections.privacy && (
              <div className="mt-4 pl-2 border-l-4 border-indigo-200 ml-3">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                    Information We Collect
                  </h3>
                  <p className="text-gray-600 ml-7">
                    We collect information that you provide directly to us, including personal and HR-related employee data. This may include:
                  </p>
                  <ul className="text-gray-600 ml-12 list-disc mt-2">
                    <li>Contact information (name, email, phone number)</li>
                    <li>Employment details (position, department, salary)</li>
                    <li>Performance evaluations and feedback</li>
                    <li>System usage data and analytics</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <Mail className="h-5 w-5 text-blue-500 mr-2" />
                    How We Use Your Information
                  </h3>
                  <p className="text-gray-600 ml-7">
                    We use the collected information for various purposes including:
                  </p>
                  <ul className="text-gray-600 ml-12 list-disc mt-2">
                    <li>Providing and maintaining our HR management services</li>
                    <li>Notifying you about changes to our platform</li>
                    <li>Allowing you to participate in interactive features</li>
                    <li>Providing customer support</li>
                    <li>Gathering analysis to improve our platform</li>
                    <li>Monitoring usage and detecting technical issues</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <Shield className="h-5 w-5 text-blue-500 mr-2" />
                    Data Security
                  </h3>
                  <p className="text-gray-600 ml-7">
                    We implement appropriate technical and organizational measures to protect personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="text-gray-600 ml-12 list-disc mt-2">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security assessments and testing</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Employee training on data protection</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <Cookie className="h-5 w-5 text-blue-500 mr-2" />
                    Cookies and Tracking Technologies
                  </h3>
                  <p className="text-gray-600 ml-7">
                    We use cookies and similar tracking technologies to track activity on our platform and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
                  </p>
                  <p className="text-gray-600 ml-7 mt-2">
                    You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                    Your Data Rights
                  </h3>
                  <p className="text-gray-600 ml-7">
                    Depending on your location, you may have the following rights regarding your personal data:
                  </p>
                  <ul className="text-gray-600 ml-12 list-disc mt-2">
                    <li>The right to access and receive a copy of your personal data</li>
                    <li>The right to rectify inaccurate or incomplete data</li>
                    <li>The right to erasure of your personal data</li>
                    <li>The right to restrict or object to processing of your data</li>
                    <li>The right to data portability</li>
                  </ul>
                  <p className="text-gray-600 ml-7 mt-2">
                    To exercise any of these rights, please contact us using the information provided in the Contact section.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="mt-10 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Us</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms & Privacy Policy, please contact us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">Email</p>
                  <p className="text-gray-600">tech@globaltechsoftwaresolutions.com </p>
                </div>
              </div>
              <div className="flex items-start">
                <PhoneCall className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">Phone number</p>
                  <p className="text-gray-600">+91 9844281875</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPrivacy;