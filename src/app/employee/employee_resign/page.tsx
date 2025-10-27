"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import axios from "axios";

interface ResignationForm {
  email: string;
  fullname: string;
  department: string;
  designation: string;
  description: string;
  offboarded_at?: string;
  approved?: string;
}

export default function ResignationPage() {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ResignationForm>({
    email: "",
    fullname: "",
    department: "",
    designation: "",
    description: "",
  });

  // 🔹 Fetch employee details from API based on stored email
  useEffect(() => {
    const storedEmail =
      localStorage.getItem("user_email") ||
      JSON.parse(localStorage.getItem("userInfo") || "{}")?.email;

    if (!storedEmail) {
      alert("User email not found. Please log in again.");
      window.location.href = "/login";
      return;
    }

    const fetchReleavedEmployees = async () => {
      try {
        const response = await axios.get(
          `https://globaltechsoftwaresolutions.cloud/api/accounts/employees/${storedEmail}/`
        );
        const emp = response.data;

        setFormData((prev) => ({
          ...prev,
          email: emp.email || "",
          fullname: emp.fullname || "",
          department: emp.department || "",
          designation: emp.designation || "",
        }));
      } catch (error) {
        console.error("Error fetching employee details:", error);
      }
    };

    fetchReleavedEmployees();
  }, []);

  

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullname || !formData.email || !formData.description) {
      alert(
        "Please fill in all required fields (Full Name, Email, and Reason are required)"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 🔹 Step 1: Update employee record with resignation reason
      const employeeUpdatePayload = {
        reason_for_resignation: formData.description,
        fullname: formData.fullname,
        department: formData.department,
        designation: formData.designation,
        email: formData.email,
      };

      console.log("📤 Employee update payload:", employeeUpdatePayload);

      await axios.patch(
        `https://globaltechsoftwaresolutions.cloud/api/accounts/employees/${formData.email}/`,
        employeeUpdatePayload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ Employee record updated successfully");

      // 🔹 Step 2: Submit resignation request to /releaved/
      const resignationPayload = {
        email: formData.email,
        fullname: formData.fullname,
        department: formData.department,
        designation: formData.designation,
        reason_for_resignation: formData.description, // ✅ correct field name
        approved: "pending",
        offboarded_at: new Date().toISOString(),
      };

      console.log("📤 Resignation payload:", resignationPayload);

      await axios.post(
        "https://globaltechsoftwaresolutions.cloud/api/accounts/releaved/",
        resignationPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ Resignation submitted successfully!");
      alert("✅ Resignation submitted successfully! Your request has been recorded.");

      setShowModal(false);
      setFormData((prev) => ({ ...prev, description: "" }));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("💥 Axios error:", error.response?.data || error.message);
        if (error.response) {
          const { status, data } = error.response;
          console.error("🚨 Server response error:", { status, data });
          if (status === 400) {
            alert(`Submission failed: ${JSON.stringify(data)}`);
          } else if (status === 404) {
            alert("API endpoint not found. Please contact administrator.");
          } else {
            alert(`Server error (${status}): Please try again.`);
          }
        }
      } else if (error instanceof Error) {
        console.error("💥 General error:", error.message);
        alert(`Error: ${error.message}`);
      } else {
        console.error("💥 Unknown error:", error);
        alert("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="employee">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Employee Resignation
            </h1>
            <p className="text-gray-600">
              Manage your employment details and submit resignation requests
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Employment Status
              </h3>
              <p className="text-2xl font-bold text-gray-800">Active</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Department
              </h3>
              <p className="text-xl font-semibold text-gray-800">
                {formData.department || "Not specified"}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Designation
              </h3>
              <p className="text-xl font-semibold text-gray-800">
                {formData.designation || "Not specified"}
              </p>
            </div>
          </div>

          {/* Resignation Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Resignation Request
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Submit your formal resignation request below to initiate the
                offboarding process. This will notify HR and your manager.
              </p>
            </div>

            {/* Employee Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-800 mb-3">Your Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Full Name:</span>
                  <p className="font-medium">
                    {formData.fullname || "Not available"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">
                    {formData.email || "Not available"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Department:</span>
                  <p className="font-medium">
                    {formData.department || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Designation:</span>
                  <p className="font-medium">
                    {formData.designation || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Submit Resignation Request
              </button>
            </div>

            {/* Important Notes */}
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Important Information
              </h3>
              <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
                <li>Resignation requests are subject to approval by HR</li>
                <li>Standard notice period as per your contract will apply</li>
                <li>You’ll be contacted for exit formalities</li>
                <li>All company property must be returned before settlement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl p-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Resignation Form</h2>
                  <p className="text-red-100 text-sm mt-1">
                    Please review and confirm your resignation
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="text-red-100 hover:text-white transition-colors disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Resignation{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    placeholder="Please provide a detailed reason for your resignation..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 resize-none"
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This reason will be recorded in your employee profile
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 p-6 flex justify-between gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !formData.fullname ||
                    !formData.email ||
                    !formData.description
                  }
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Resignation"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </DashboardLayout>
  );
}