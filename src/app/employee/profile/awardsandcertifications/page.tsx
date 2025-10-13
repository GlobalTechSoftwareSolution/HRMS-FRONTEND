"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardLayout from "@/components/DashboardLayout";
import { nhost } from "@/app/lib/nhost";
import Link from "next/link";
import { FiUser, FiPhone, FiHeart, FiSave, FiEdit3 } from "react-icons/fi";

type Employee = {
  email: string;
  fullname?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_no?: string;
};

export default function EmployeeProfilePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 🔹 Get logged-in user's email
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const storedEmail = localStorage.getItem("user_email");
        if (storedEmail) {
          setUserEmail(storedEmail);
          return;
        }

        const user = await nhost.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
          localStorage.setItem("user_email", user.email);
        } else {
          nhost.auth.onAuthStateChanged((_event, session) => {
            if (session?.user?.email) {
              setUserEmail(session.user.email);
              localStorage.setItem("user_email", session.user.email);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
        toast.error("Unable to authenticate user");
      }
    };

    fetchUserEmail();
  }, []);

  // 🔹 Fetch employee data
  const fetchEmployee = useCallback(async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(
          userEmail
        )}/`
      );

      const employeeData: Employee = {
        email: response.data.email || userEmail,
        fullname: response.data.fullname || "",
        emergency_contact_name: response.data.emergency_contact_name || "",
        emergency_contact_relationship:
          response.data.emergency_contact_relationship || "",
        emergency_contact_no: response.data.emergency_contact_no || "",
      };

      setEmployee(employeeData);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Error fetching employee:", error);
      const errorMessage =
        error.response?.data?.message || "Could not load employee data";

      if (error.response?.status === 404) {
        setEmployee({
          email: userEmail,
          fullname: "",
          emergency_contact_name: "",
          emergency_contact_relationship: "",
          emergency_contact_no: "",
        });
        toast.info(
          "No existing employee record found. You can create one now."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) fetchEmployee();
  }, [userEmail, fetchEmployee]);

  // 🔹 Handle input changes
  const handleChange = (field: keyof Employee, value: string) => {
    setEmployee((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // 🔹 Validate form data
  const validateForm = (): boolean => {
    if (!employee) return false;

    if (
      employee.emergency_contact_no &&
      !/^[\d\s\-\+\(\)]{10,}$/.test(employee.emergency_contact_no)
    ) {
      toast.error("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  // 🔹 Save employee data
  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!employee?.email) {
      toast.error("No email associated with this employee");
      return;
    }

    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const payload = {
        email: employee.email,
        fullname: employee.fullname || "",
        emergency_contact_name: employee.emergency_contact_name || "",
        emergency_contact_relationship:
          employee.emergency_contact_relationship || "",
        emergency_contact_no: employee.emergency_contact_no || "",
      };

      console.log("Saving employee data:", payload);

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(
          employee.email
        )}/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Employee information saved successfully!");
      setIsEditing(false);
      await fetchEmployee();
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Error saving employee:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save employee information";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employee information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No employee data state
  if (!employee) {
    return (
      <DashboardLayout role="employee">
        <div className="max-w-2xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUser className="text-red-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Employee Data Found
            </h3>
            <p className="text-gray-600 mb-6">
              Unable to load employee information. This might be your first time
              setting up your profile.
            </p>
            <button
              onClick={fetchEmployee}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <Link
              href="/employee/profile"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Emergency Contact Information
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your emergency contact details for workplace safety
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                isEditing
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <FiEdit3 size={18} />
              {isEditing ? "Cancel Editing" : "Edit Information"}
            </button>
          </div>
        </div>

        {/* Emergency Contact Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FiHeart className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Emergency Contact Details
              </h2>
              <p className="text-gray-600 text-sm">
                This information will be used in case of emergencies
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FiUser size={16} />
                Contact Name *
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={employee.emergency_contact_name || ""}
                onChange={(e) =>
                  handleChange("emergency_contact_name", e.target.value)
                }
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              />
            </div>

            {/* Relationship */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FiHeart size={16} />
                Relationship *
              </label>
              <input
                type="text"
                placeholder="e.g., Spouse, Parent, Sibling"
                value={employee.emergency_contact_relationship || ""}
                onChange={(e) =>
                  handleChange("emergency_contact_relationship", e.target.value)
                }
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              />
            </div>

            {/* Phone Number */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FiPhone size={16} />
                Phone Number *
              </label>
              <input
                type="tel"
                placeholder="Enter phone number with country code"
                value={employee.emergency_contact_no || ""}
                onChange={(e) =>
                  handleChange("emergency_contact_no", e.target.value)
                }
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              />
              <p className="text-xs text-gray-500">
                Include country code (e.g., +1 555-0123)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
          <div className="flex gap-4">
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <FiSave size={18} />
                {isSaving ? "Saving Changes..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </DashboardLayout>
  );
}
