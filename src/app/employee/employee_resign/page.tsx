// Resignation Progress Tracker and Page
"use client";

import React, { useState, useEffect, useCallback } from "react";
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

interface ResignationStatusData {
  email: string;
  fullname: string;
  manager_approved?: string | boolean;
  hr_approved?: string | boolean;
  manager_description?: string;
  hr_description?: string;
  reason_for_resignation?: string;
  offboarded_at?: string;
  approved?: string;
  department?: string;
  designation?: string;
}

// --- Resignation Progress Tracker Component ---
function ResignationStatus({ email }: { email: string }) {
  const [statusData, setStatusData] = useState<ResignationStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset loading state when email changes
    setLoading(true);
    setStatusData(null);
    
    const fetchStatus = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_releaved/?t=${timestamp}`
        );
        const all: ResignationStatusData[] = Array.isArray(res.data) ? res.data : (res.data?.releaved_employees || res.data?.resignations || res.data?.data || []);
        const userData = all.find((item: ResignationStatusData) => item.email === email);
        setStatusData(userData || null);
      } catch (err) {
        console.error("Error fetching resignation status:", err);
        setStatusData(null);
      } finally {
        setLoading(false);
      }
    };
    
    let interval: NodeJS.Timeout | null = null;
    
    if (email) {
      fetchStatus();
      // Poll for updates every 30 seconds to ensure real-time data
      interval = setInterval(fetchStatus, 30000);
    } else {
      setLoading(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [email]);

  if (loading)
    return <p className="text-center text-gray-500">Fetching resignation details...</p>;

  if (!statusData)
    return (
      <div className="text-center">
        <p className="text-gray-600 font-medium">No resignation request found yet.</p>
      </div>
    );

  const steps = [
    { label: "Applied", active: !!statusData },
    {
      label: "Manager Approved",
      active:
        statusData.manager_approved?.toString().toLowerCase() === "approved" ||
        statusData.manager_approved?.toString().toLowerCase() === "yes",
      rejected:
        statusData.manager_approved?.toString().toLowerCase() === "rejected" ||
        statusData.manager_approved?.toString().toLowerCase() === "no",
    },
    {
      label: "HR Attested",
      active:
        statusData.hr_approved?.toString().toLowerCase() === "approved" ||
        statusData.hr_approved?.toString().toLowerCase() === "yes" ||
        statusData.hr_approved === true,
      rejected:
        statusData.hr_approved?.toString().toLowerCase() === "rejected" ||
        statusData.hr_approved?.toString().toLowerCase() === "no",
    },
    {
      label: "Relieved",
      active:
        !!statusData.offboarded_at &&
        (statusData.hr_approved?.toString().toLowerCase() === "approved" ||
          statusData.hr_approved?.toString().toLowerCase() === "yes" ||
          statusData.hr_approved === true),
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-2xl relative">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Circle & Label with Hover Card */}
            <div className="flex flex-col items-center relative z-10 group cursor-pointer">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-500 ${
                  step.rejected
                    ? "bg-red-500 scale-110 shadow-lg"
                    : step.active
                    ? "bg-green-500 scale-110 shadow-lg"
                    : "bg-gray-300"
                }`}
              >
                {step.rejected ? "❌" : step.active ? "✓" : index + 1}
              </div>
              <p className="text-sm mt-2 font-medium text-gray-700">{step.label}</p>
                            {(step.rejected || step.active) && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-white text-xs">i</span>
                              </div>
                            )}

              {/* Hover Card: display consistent data for each step */}
              {(step.rejected || step.active) && (
                <div className="absolute bottom-12 w-72 bg-white shadow-xl border-2 border-blue-100 rounded-lg p-4 text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-20">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-blue-100 rotate-45"></div>
                  <p className="font-semibold text-gray-800 mb-2 text-center border-b border-gray-100 pb-2">
                    {step.label === "Applied" && "📝 Resignation Reason"}
                    {step.label === "Manager Approved" && "👨‍💼 Manager Response"}
                    {step.label === "HR Attested" && "👥 HR Response"}
                    {step.label === "Relieved" && "🎉 Relieved Details"}
                  </p>
                  <p className="text-gray-700 max-h-32 overflow-y-auto">
                    {step.label === "Applied" && (
                      <span className="italic">{statusData.reason_for_resignation?.trim() || "No reason provided."}</span>
                    )}
                    {step.label === "Manager Approved" && (
                      <span className="italic">{statusData.manager_description?.trim() || "No response provided."}</span>
                    )}
                    {step.label === "HR Attested" && (
                      <span className="italic">{statusData.hr_description?.trim() || "No response provided."}</span>
                    )}
                    {step.label === "Relieved" && (
                      <div className="space-y-2">
                        {statusData.manager_description?.trim() && (
                          <div>
                            <span className="font-semibold text-blue-600">Manager: </span>
                            <span className="italic">{statusData.manager_description.trim()}</span>
                          </div>
                        )}
                        {statusData.hr_description?.trim() && (
                          <div>
                            <span className="font-semibold text-blue-600">HR: </span>
                            <span className="italic">{statusData.hr_description.trim()}</span>
                          </div>
                        )}
                        {!statusData.manager_description?.trim() && !statusData.hr_description?.trim() && (
                          <span className="italic">No response provided.</span>
                        )}
                      </div>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Line Connector */}
            {index < steps.length - 1 && (
              <div className="relative flex-1 h-1 bg-gray-300 -translate-y-2 overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full bg-green-500 transition-all duration-700 ease-in-out ${
                    step.active || steps[index + 1].active ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Success Message when fully relieved */}
      {steps[steps.length - 1].active && (
        <div className="mt-6 text-center">
          <p className="text-green-600 text-lg font-semibold">
            🎉 Successfully Relieved!
          </p>
          <p className="text-gray-500 text-sm">
            Your offboarding process has been completed. Wishing you all the best for your future endeavors!
          </p>
        </div>
      )}

      {/* User Info Card */}
      {statusData.approved === "yes" && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-2xl">
          <h3 className="font-semibold text-blue-800 mb-3 text-center">Final Resignation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Full Name:</span>
              <p className="font-medium">{statusData.fullname}</p>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <p className="font-medium break-all">{statusData.email}</p>
            </div>
            <div>
              <span className="text-gray-600">Department:</span>
              <p className="font-medium">{statusData.department}</p>
            </div>
            <div>
              <span className="text-gray-600">Designation:</span>
              <p className="font-medium">{statusData.designation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
  // Add state to track pending resignation
  const [hasPendingResignation, setHasPendingResignation] = useState(false);

  // Function to check if the user has a pending resignation request
  const checkExistingResignation = useCallback(async () => {
    try {
      console.log('🔍 Checking existing resignation for email:', formData.email);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_releaved/?t=${timestamp}`
      );

      const all: ResignationStatusData[] = Array.isArray(res.data) ? res.data : (res.data?.releaved_employees || res.data?.resignations || res.data?.data || []);
      const existing = all.find(
        (item: ResignationStatusData) => item.email === formData.email
      );
      // Check if user has any resignation record (pending or approved)
      if (existing) {
        setHasPendingResignation(true);
      } else {
        setHasPendingResignation(false);
      }
    } catch (err) {
      console.error("Error checking existing resignation:", err);
      setHasPendingResignation(false);
    }
  }, [formData.email]);

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
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${storedEmail}/`
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

  // Effect to check if the user has a pending resignation request
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
        
        if (formData.email) {
          checkExistingResignation();
          // Poll for updates every 30 seconds
          interval = setInterval(checkExistingResignation, 30000);
        }
        
        return () => {
          if (interval) clearInterval(interval);
        };
  }, [formData.email, checkExistingResignation]);


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
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${formData.email}/`,
        employeeUpdatePayload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

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

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/releaved/`,
        resignationPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      alert("✅ Resignation submitted successfully! Your request has been recorded.");

      setShowModal(false);
      setFormData((prev) => ({ ...prev, description: "" }));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Axios error
        if (error.response) {
          const { status, data } = error.response;
          // Server response error
          if (status === 400) {
            alert(`Submission failed: ${JSON.stringify(data)}`);
            // Check for existing resignation when submission fails due to existing record
            // Check for existing resignation after 400 error
            setTimeout(() => {
              checkExistingResignation();
            }, 1000);
          } else if (status === 404) {
            alert("API endpoint not found. Please contact administrator.");
          } else {
            alert(`Server error (${status}): Please try again.`);
                    // Even if submission fails, check if there's an existing resignation
                    // Check for existing resignation after failed submission
                    setTimeout(() => {
                      checkExistingResignation();
                    }, 1000);
          }
        }
      } else if (error instanceof Error) {
        console.error("General error:", error.message);
        alert(`Error: ${error.message}`);
      } else {
        console.error("Unknown error:", error);
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
              <p
                className={`text-2xl font-bold ${
                  !formData.fullname && !formData.email
                    ? "text-red-600"
                    : "text-gray-800"
                }`}
              >
                {!formData.fullname && !formData.email ? "Inactive" : "Active"}
              </p>
              <p className="text-sm text-gray-500">
                {!formData.fullname && !formData.email
                  ? "Please contact HR for activation."
                  : "Currently employed and active in the system."}
              </p>
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
          {(() => {
            const isEmployeeInactive =
              !formData.fullname &&
              !formData.email &&
              (!formData.department || formData.department === "Not specified") &&
              (!formData.designation || formData.designation === "Not specified");
            return isEmployeeInactive ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Inactive Employee</h2>
                <p className="text-gray-600 text-sm">
                  Your employment details are not available in the system.
                  <br />
                  Please contact the HR department for assistance.
                </p>
              </div>
            ) : (
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
                      <p className="font-medium break-all">
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
                  {hasPendingResignation ? (
                    <p className="text-gray-500 text-sm font-medium bg-gray-100 px-6 py-3 rounded-lg border border-gray-300">
                      You have already submitted a resignation request. Please wait for HR approval.
                    </p>
                  ) : (
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
                  )}
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
            );
          })()}

          {/* Resignation Progress Tracker */}
          <div className="mt-10 bg-white rounded-xl shadow-sm p-8 border-t-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Resignation Progress
            </h2>
            {formData.email ? (
              <ResignationStatus email={formData.email} />
            ) : (
              <p className="text-center text-gray-500">Loading your resignation status...</p>
            )}
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