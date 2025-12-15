"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FiSave,
  FiEdit,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiMail,
  FiCamera,
  FiCalendar,
} from "react-icons/fi";

type UserProfile = {
  name: string;
  email: string;
  picture?: string;
  role?: string;
  phone?: string;
  department?: string;
  date_of_birth?: string;
  date_joined?: string;
  age?: number;
  ageManual?: boolean;
  team_size?: number | null;
  manager_level?: number | null;
  projects_handled?: number | null;
};

type FetchUserResponse = {
  fullname?: string;
  email: string;
  profile_picture?: string;
  role?: string;
  phone?: string;
  department?: string;
  date_of_birth?: string;
  date_joined?: string;
  age?: number;
  team_size?: number | null;
  manager_level?: number | null;
  projects_handled?: number | null;
};

type Department = {
  department_name: string;
  [key: string]: unknown;
};

export default function Profile() {
  const [user, setUser] = useState<UserProfile>({
    name: "",
    email: "",
    picture: "/default-profile.png",
    role: "",
    phone: "",
    department: "",
    date_of_birth: "",
    date_joined: "",
    age: undefined,
    ageManual: false,
    team_size: null,
    manager_level: null,
    projects_handled: null,
  });

  const [departments, setDepartments] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

  const calculateAge = (dob: string) => {
    if (!dob) return undefined;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const normalizeImageUrl = useCallback((url?: string) => {
    if (!url) return "/default-profile.png";
    if (url.startsWith("http")) return url;
    return `${API_BASE.replace(/\/$/, "")}/${url}`;
  }, [API_BASE]);

  useEffect(() => {
    const fetchUserData = async (email: string) => {
      try {
        const res = await fetch(`${API_BASE}/api/accounts/managers/${encodeURIComponent(email)}/`);
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data: FetchUserResponse = await res.json();
        const dob = data.date_of_birth || "";

        setUser({
          name: data.fullname || "",
          email: data.email,
          picture: normalizeImageUrl(data.profile_picture),
          role: data.role || "",
          phone: data.phone || "",
          department: data.department || "",
          date_of_birth: dob,
          date_joined: data.date_joined || "",
          age: calculateAge(dob),
          ageManual: false,
          team_size: data.team_size ?? null,
          manager_level: data.manager_level ?? null,
          projects_handled: data.projects_handled ?? null,
        });
      } catch (error) {
        console.error(error);
        setSaveMessage({ type: "error", text: "Failed to load profile data." });
      }
    };

    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as { email?: string };
      if (parsed.email) fetchUserData(parsed.email);
    }
  }, [API_BASE, normalizeImageUrl]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/accounts/departments/`);
        if (!res.ok) throw new Error("Failed to fetch departments");
        const data = await res.json();
        const departmentsArray = Array.isArray(data) ? data : (data?.departments || data?.data || []);
        setDepartments(departmentsArray.map((d: Department) => d.department_name));
      } catch (error) {
        console.error(error);
      }
    };
    fetchDepartments();
  }, [API_BASE]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUser(prev => ({ ...prev, picture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (user.phone && !/^[\+]?[0-9]{6,15}$/.test(user.phone.replace(/\s/g, ""))) {
      setSaveMessage({ type: "error", text: "Please enter a valid phone number" });
      return;
    }

    setIsSaving(true);
    try {
      const fileInput = fileInputRef.current?.files?.[0];
      const formData = new FormData();
      formData.append("fullname", user.name);
      formData.append("phone", user.phone || "");
      formData.append("department", user.department || "");
      formData.append("date_of_birth", user.date_of_birth || "");
      formData.append("date_joined", user.date_joined || "");
      if (user.age !== undefined) formData.append("age", String(user.age));
      formData.append("team_size", user.team_size !== null ? String(user.team_size) : "");
      formData.append("manager_level", user.manager_level !== null ? String(user.manager_level) : "");
      formData.append("projects_handled", user.projects_handled !== null ? String(user.projects_handled) : "");
      if (fileInput) formData.append("profile_picture", fileInput);

      const response = await fetch(`${API_BASE}/api/accounts/managers/${encodeURIComponent(user.email)}/`, {
        method: "PATCH",
        body: formData,
      });

      const text = await response.text();
      if (!response.ok) throw new Error(`Failed to update profile: ${text}`);
      const updatedUser: FetchUserResponse = JSON.parse(text);

      const dob = updatedUser.date_of_birth || user.date_of_birth || "";
      setUser({
        name: updatedUser.fullname || user.name,
        email: updatedUser.email || user.email,
        picture: normalizeImageUrl(updatedUser.profile_picture),
        role: updatedUser.role || user.role,
        phone: updatedUser.phone || user.phone,
        department: updatedUser.department || user.department,
        date_of_birth: dob,
        date_joined: updatedUser.date_joined || user.date_joined,
        age: calculateAge(dob),
        ageManual: false,
        team_size: updatedUser.team_size ?? user.team_size,
        manager_level: updatedUser.manager_level ?? user.manager_level,
        projects_handled: updatedUser.projects_handled ?? user.projects_handled,
      });

      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setSaveMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save profile." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleCancel = () => setIsEditing(false);

  return (
    <DashboardLayout role="manager">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">Profile Information</h1>

        {saveMessage.text && (
          <div className={`mb-6 p-3 rounded-md text-sm sm:text-base ${saveMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {saveMessage.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <div className="relative flex-shrink-0">
            <Image
              src={user.picture || "/default-profile.png"}
              alt={user.name || "Profile"}
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-blue-500 shadow-md object-cover"
              unoptimized
            />
            {isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full shadow-md hover:bg-blue-600 transition-colors"
                  type="button"
                >
                  <FiCamera size={14} />
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiUser size={14} /> Full Name</label>
            <input type="text" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} disabled={!isEditing} className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiMail size={14} /> Email Address</label>
            <input type="email" value={user.email} disabled className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full bg-gray-100" />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiPhone size={14} /> Phone Number</label>
            <input type="tel" value={user.phone || ""} onChange={(e) => setUser({ ...user, phone: e.target.value })} disabled={!isEditing} placeholder="Enter phone number" className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiBriefcase size={14} /> Department</label>
            <select value={user.department || ""} onChange={(e) => setUser({ ...user, department: e.target.value })} disabled={!isEditing} className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* DOB */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiCalendar size={14} /> Date of Birth</label>
            <input type="date" value={user.date_of_birth || ""} onChange={e => setUser({ ...user, date_of_birth: e.target.value, age: user.ageManual ? user.age : calculateAge(e.target.value) })} disabled={!isEditing} className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />

            <label className="block text-sm font-medium text-gray-700 mt-2">Age</label>
            <input type="number" value={user.age || ""} onChange={e => setUser({ ...user, age: Number(e.target.value), ageManual: true })} disabled={!isEditing} className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Date Joined */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mt-2">Date Joined</label>
            <input
              type="date"
              value={user.date_joined || ""}
              onChange={e => setUser({ ...user, date_joined: e.target.value })}
              disabled={!isEditing}
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />

            {/* Ventiage Field */}
            <label className="block text-sm font-medium text-gray-700 mt-2">Ventiage</label>
            <VentiageInput date_joined={user.date_joined} />
          </div>

          {/* Team Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mt-2">Team Size</label>
            <input type="number" value={user.team_size ?? ""} onChange={e => setUser({ ...user, team_size: e.target.value ? Number(e.target.value) : null })} disabled={!isEditing} className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Manager Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mt-2">Manager Level</label>
            <input type="number" value={user.manager_level ?? ""} onChange={e => setUser({ ...user, manager_level: e.target.value ? Number(e.target.value) : null })} disabled={!isEditing} className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Projects Handled */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mt-2">Projects Handled</label>
            <input type="number" value={user.projects_handled ?? ""} onChange={e => setUser({ ...user, projects_handled: e.target.value ? Number(e.target.value) : null })} disabled={!isEditing} className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Buttons */}
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="flex items-center mt-5 justify-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700">
            <FiEdit size={16} /> Edit Profile
          </button>
        ) : (
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={handleCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-70">
              {isSaving ? "Saving..." : <><FiSave size={16} /> Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
// Utility for Ventiage calculation
function calculateVentiage(date_joined: string): { years: number; months: number; days: number } {
  if (!date_joined) return { years: 0, months: 0, days: 0 };
  const joinDate = new Date(date_joined);
  if (isNaN(joinDate.getTime())) return { years: 0, months: 0, days: 0 };
  const now = new Date();
  let years = now.getFullYear() - joinDate.getFullYear();
  let months = now.getMonth() - joinDate.getMonth();
  let days = now.getDate() - joinDate.getDate();
  if (days < 0) {
    months -= 1;
    // Get days in previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return { years: 0, months: 0, days: 0 };
  return { years, months, days };
}

// Live Ventiage Input (below Date Joined)
function VentiageInput({ date_joined }: { date_joined?: string }) {
  const [ventiageStr, setVentiageStr] = useState<string>("");
  // Helper to format: always show years, months, and days (even if zero)
  const formatVentiage = (d: { years: number; months: number; days: number }) => {
    const { years, months, days } = d;
    // Always show all three values, even if zero
    return `${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""}, ${days} day${days !== 1 ? "s" : ""}`;
  };
  useEffect(() => {
    setVentiageStr(formatVentiage(calculateVentiage(date_joined || "")));
  }, [date_joined]);
  // Update every day at midnight for live update if page is open
  useEffect(() => {
    if (!date_joined) return;
    const now = new Date();
    const msToMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime() - now.getTime();
    const timeout = setTimeout(() => {
      setVentiageStr(formatVentiage(calculateVentiage(date_joined)));
    }, msToMidnight + 1000);
    return () => clearTimeout(timeout);
  }, [date_joined, ventiageStr]);
  return (
    <input
      type="text"
      value={ventiageStr}
      readOnly
      className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full bg-gray-100"
      placeholder="Ventiage"
      tabIndex={-1}
    />
  );
}
