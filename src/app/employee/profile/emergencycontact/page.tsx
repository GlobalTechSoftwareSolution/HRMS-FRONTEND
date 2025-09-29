"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardLayout from "@/components/DashboardLayout";
import { nhost } from "@/app/lib/nhost";

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
    const storedEmail = localStorage.getItem("user_email");
    if (storedEmail) setUserEmail(storedEmail);
    else {
      const fetchUser = async () => {
        const user = await nhost.auth.getUser();
        if (user?.email) setUserEmail(user.email);
        else {
          nhost.auth.onAuthStateChanged((_event, session) => {
            if (session?.user?.email) setUserEmail(session.user.email);
          });
        }
      };
      fetchUser();
    }
  }, []);

  // 🔹 Fetch employee
  const fetchEmployee = useCallback(async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(userEmail)}/`
      );
      setEmployee(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Could not load employee!");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) fetchEmployee();
  }, [userEmail, fetchEmployee]);

  // 🔹 Handle input change
  const handleChange = (field: keyof Employee, value: string) => {
    setEmployee(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  // 🔹 Save employee
  const handleSave = async () => {
    if (!employee?.email) return;
    try {
      setIsSaving(true);
      const payload = {
        emergency_contact_name: employee.emergency_contact_name || "",
        emergency_contact_relationship: employee.emergency_contact_relationship || "",
        emergency_contact_no: employee.emergency_contact_no || "",
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(employee.email)}/`,
        payload
      );

      toast.success("Employee updated!");
      setIsEditing(false);
      fetchEmployee();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Update failed!");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔹 Delete only employee record (keep user intact)
  const handleDelete = async () => {
    if (!employee?.email) return;
    try {
      setIsSaving(true);

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(employee.email)}/`
      );

      toast.success("Employee record deleted!");
      setEmployee(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Delete failed!");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout role="employee">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">No employee data found</p>
          <button
            onClick={fetchEmployee}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="max-w-3xl mx-auto space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Emergency Contact</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={employee.emergency_contact_name || ""}
            onChange={e => handleChange("emergency_contact_name", e.target.value)}
            disabled={!isEditing}
            className="px-4 py-2 border rounded-lg w-full"
          />
          <input
            type="text"
            placeholder="Relationship"
            value={employee.emergency_contact_relationship || ""}
            onChange={e =>
              handleChange("emergency_contact_relationship", e.target.value)
            }
            disabled={!isEditing}
            className="px-4 py-2 border rounded-lg w-full"
          />
          <input
            type="text"
            placeholder="Phone"
            value={employee.emergency_contact_no || ""}
            onChange={e => handleChange("emergency_contact_no", e.target.value)}
            disabled={!isEditing}
            className="px-4 py-2 border rounded-lg w-full"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={isSaving || !employee?.email}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isSaving || !employee?.email}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Delete Employee Record
          </button>
        </div>

        <ToastContainer position="top-right" autoClose={4000} />
      </div>
    </DashboardLayout>
  );
}
