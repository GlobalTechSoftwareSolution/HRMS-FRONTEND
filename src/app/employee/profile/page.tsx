"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import Docs from "@/components/docs";


import {
  FiSave,
  FiEdit,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiMail,
  FiCamera,
} from "react-icons/fi";

type UserProfile = {
  email: string;
  fullname: string;
  phone?: string;
  department?: string;
  designation?: string;
  date_of_birth?: string;
  date_joined?: string;
  skills?: string;
  profile_picture?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  current_address?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_no?: string;
  emp_id?: string;
  employment_type?: string;
  work_location?: string;
  team?: string;
  degree?: string;
  degree_passout_year?: string;
  institution?: string;
  grade?: string;
  languages?: string;
  reports_to?: string;
};


export default function Profile() {
  const [user, setUser] = useState<UserProfile>({
    email: "",
    fullname: "",
    phone: "",
    department: "",
    designation: "",
    date_of_birth: "",
    date_joined: "",
    skills: "",
    profile_picture: "",
    gender: "",
    marital_status: "",
    nationality: "",
    current_address: "",
    permanent_address: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_no: "",
    emp_id: "",
    employment_type: "",
    work_location: "",
    team: "",
    degree: "",
    degree_passout_year: "",
    institution: "",
    grade: "",
    languages: "",
    reports_to: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  // Store original user for Cancel
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async (email: string) => {
      try {
        const response: Response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(
            email
          )}/`,
          { headers: { "Content-Type": "application/json" } }
        );
        if (!response.ok) throw new Error("Failed to fetch user data");
        const currentUser: Record<string, unknown> = await response.json();
        // Map only the allowed fields from backend to frontend
        const loadedUser: UserProfile = {
          email: typeof currentUser.email === "string" ? currentUser.email : email,
          fullname: typeof currentUser.fullname === "string" ? currentUser.fullname : "",
          phone: typeof currentUser.phone === "string" ? currentUser.phone : "",
          department: typeof currentUser.department === "string" ? currentUser.department : "",
          designation: typeof currentUser.designation === "string" ? currentUser.designation : "",
          date_of_birth: typeof currentUser.date_of_birth === "string" ? currentUser.date_of_birth : "",
          date_joined: typeof currentUser.date_joined === "string" ? currentUser.date_joined : "",
          skills: typeof currentUser.skills === "string" ? currentUser.skills : "",
          profile_picture: typeof currentUser.profile_picture === "string"
            ? currentUser.profile_picture
            : "/default-profile.png",
          gender: typeof currentUser.gender === "string" ? currentUser.gender : "",
          marital_status: typeof currentUser.marital_status === "string" ? currentUser.marital_status : "",
          nationality: typeof currentUser.nationality === "string" ? currentUser.nationality : "",
          current_address: typeof currentUser.current_address === "string" ? currentUser.current_address : "",
          permanent_address: typeof currentUser.permanent_address === "string" ? currentUser.permanent_address : "",
          emergency_contact_name: typeof currentUser.emergency_contact_name === "string" ? currentUser.emergency_contact_name : "",
          emergency_contact_relationship: typeof currentUser.emergency_contact_relationship === "string" ? currentUser.emergency_contact_relationship : "",
          emergency_contact_no: typeof currentUser.emergency_contact_no === "string" ? currentUser.emergency_contact_no : "",
          emp_id: typeof currentUser.emp_id === "string" ? currentUser.emp_id : "",
          employment_type: typeof currentUser.employment_type === "string" ? currentUser.employment_type : "",
          work_location: typeof currentUser.work_location === "string" ? currentUser.work_location : "",
          team: typeof currentUser.team === "string" ? currentUser.team : "",
          degree: typeof currentUser.degree === "string" ? currentUser.degree : "",
          degree_passout_year: typeof currentUser.degree_passout_year === "string" ? currentUser.degree_passout_year : "",
          institution: typeof currentUser.institution === "string" ? currentUser.institution : "",
          grade: typeof currentUser.grade === "string" ? currentUser.grade : "",
          languages: typeof currentUser.languages === "string" ? currentUser.languages : "",
          reports_to: typeof currentUser.reports_to === "string" ? currentUser.reports_to : "",
        };
        setUser(loadedUser);
        setOriginalUser(loadedUser);
      } catch (error: unknown) {
        console.error("Error fetching user data:", error);
        setSaveMessage({ type: "error", text: "Failed to load profile data." });
      }
    };

    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as { email?: string };
      if (parsed.email) fetchUserData(parsed.email);
    }
  }, []);

  // Image preview
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setUser((prev) => ({ ...prev, profile_picture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // Save profile
 const handleSave = async () => {
  setIsSaving(true);
  try {
    const fileInput = fileInputRef.current?.files?.[0];

    // Helper: Normalize empty/undefined/whitespace values to null
    const normalize = (value: unknown): string | null =>
      value != null && value.toString().trim() !== "" ? value.toString().trim() : null;

    // Helper: Date to YYYY-MM-DD or null (safe for any type)
    const formatDate = (value: unknown): string | null => {
      if (!value) return null;
      const d = new Date(value as string);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };

    // Ensure certain fields are valid strings or null
    const normalizeStringOrNull = (value: unknown): string | null =>
      value != null && value.toString().trim() !== "" ? value.toString().trim() : null;

    // Build payload as object, then decide to send as FormData or JSON
    const payload: { [key: string]: string | null } = {
      fullname: normalize(user.fullname),
      phone: normalize(user.phone),
      department: normalize(user.department),
      designation: normalize(user.designation),
      date_of_birth: formatDate(user.date_of_birth),
      date_joined: formatDate(user.date_joined),
      skills: normalize(user.skills),
      gender: normalize(user.gender),
      marital_status: normalize(user.marital_status),
      nationality: normalize(user.nationality),
      current_address: normalize(user.current_address),
      permanent_address: normalize(user.permanent_address),
      emergency_contact_name: normalize(user.emergency_contact_name),
      emergency_contact_relationship: normalize(user.emergency_contact_relationship),
      emergency_contact_no: normalize(user.emergency_contact_no),
      emp_id: normalizeStringOrNull(user.emp_id),
      employment_type: normalize(user.employment_type),
      work_location: normalizeStringOrNull(user.work_location),
      team: normalizeStringOrNull(user.team),
      degree: normalize(user.degree),
      degree_passout_year: normalize(user.degree_passout_year),
      institution: normalize(user.institution),
      grade: normalize(user.grade),
      languages: normalize(user.languages),
      reports_to: normalizeStringOrNull(user.reports_to),
    };

    // Remove keys with undefined so backend gets null for empty
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) payload[k] = null;
    });

    const fetchOptions: RequestInit = {
      method: "PATCH",
    };

    const isMultipart = !!fileInput;
    let dataToSend: unknown;
    if (isMultipart) {
      // Use FormData for file uploads
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        // FormData: null or undefined → empty string, otherwise string value
        formData.append(k, v == null ? "" : v);
      });
      formData.append("profile_picture", fileInput);
      dataToSend = formData;
      fetchOptions.body = formData;
      // Do NOT set Content-Type for FormData; browser will set boundary
    } else {
      // Explicitly send JSON, fallback for PATCH without file
      fetchOptions.headers = { "Content-Type": "application/json" };
      fetchOptions.body = JSON.stringify(payload);
      dataToSend = payload;
    }

    // Log payload for debugging
    console.log("Sending normalized payload to backend:", dataToSend);

    const response: Response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(user.email)}/`,
      fetchOptions
    );

    // Log full backend response for debugging
    const responseText = await response.text();
    console.log("Backend response status:", response.status, "text:", responseText);
    let parsedData: unknown = null;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = null;
    }

    if (!response.ok) {
      // Graceful error for backend 500 errors (raw HTML)
      let errorMsg = "";
      if (response.status >= 500) {
        // Try to extract error message from HTML if possible
        const match = responseText.match(/<title>(.*?)<\/title>/i);
        errorMsg =
          "Server error: " +
          (match && match[1]
            ? match[1]
            : "An unexpected error occurred. Please try again later.");
      } else if (parsedData) {
        errorMsg = typeof parsedData === "string" ? parsedData : JSON.stringify(parsedData);
      } else {
        errorMsg = "Failed to update profile: " + responseText.slice(0, 200);
      }
      setSaveMessage({
        type: "error",
        text: errorMsg,
      });
      setIsSaving(false);
      return;
    }

    const updatedUser: Record<string, unknown> = typeof parsedData === "object" && parsedData !== null ? (parsedData as Record<string, unknown>) : {};
    setUser((prev) => ({ ...prev, ...updatedUser }));
    localStorage.setItem("userInfo", JSON.stringify({ ...user, ...updatedUser }));
    setSaveMessage({ type: "success", text: "Profile updated successfully!" });
    // Scroll to top smoothly after save
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsEditing(false);
  } catch (error: unknown) {
    console.error(error);
    setSaveMessage({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Failed to save profile changes.",
    });
  } finally {
    setIsSaving(false);
    setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
  }
};

  const handleCancel = () => {
    // Restore previous values
    if (originalUser) {
      setUser(originalUser);
    }
    setIsEditing(false);
    setSaveMessage({ type: "", text: "" });
  };



  return (
    <DashboardLayout role="employee">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-md">
        {/* Navigation Pills - only visible in edit mode */}
        {isEditing && (
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { href: "/employee/profile/documents", label: "Documents" },
              // { href: "/employee/profile/employment", label: "Employment" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm sm:text-base font-medium rounded-full 
                bg-white border border-gray-300 shadow-sm text-gray-700 
                hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 
                transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          Profile Information
        </h1>
        {saveMessage.text && (
          <div
            className={`mb-6 p-3 rounded-md text-sm sm:text-base transition-all duration-300 ${
              saveMessage.type === "success"
                ? "bg-green-100 text-green-700 animate-pulse"
                : "bg-red-100 text-red-700"
            }`}
          >
            {saveMessage.text}
          </div>
        )}
        {/* Profile Picture Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <Image
                src={user.profile_picture || "/default-profile.png"}
                alt={user.fullname || "Profile"}
                width={96}
                height={96}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-blue-500 shadow-md object-cover"
                unoptimized={!!(user.profile_picture && user.profile_picture.startsWith("http"))}
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
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>
        </section>
        {/* Personal Information */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <FiUser size={14} /> Full Name
              </label>
              <input
                type="text"
                value={user.fullname}
                onChange={(e) => setUser({ ...user, fullname: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <FiMail size={14} /> Email Address
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full bg-gray-100"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <FiPhone size={14} /> Phone Number
              </label>
              <input
                type="tel"
                value={user.phone || ""}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                disabled={!isEditing ? true : false}
                placeholder="Enter your phone number"
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
            {/* Date of Birth */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={
                  user.date_of_birth && /^\d{4}-\d{2}-\d{2}$/.test(user.date_of_birth)
                    ? user.date_of_birth
                    : (user.date_of_birth && !isNaN(Date.parse(user.date_of_birth))
                        ? new Date(user.date_of_birth).toISOString().slice(0, 10)
                        : "")
                }
                onChange={(e) => setUser({ ...user, date_of_birth: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
            {/* Gender */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <input
                type="text"
                value={user.gender || ""}
                onChange={(e) => setUser({ ...user, gender: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter gender"
              />
            </div>
            {/* Marital Status */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Marital Status</label>
              <input
                type="text"
                value={user.marital_status || ""}
                onChange={(e) => setUser({ ...user, marital_status: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter marital status"
              />
            </div>
            {/* Nationality */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Nationality</label>
              <input
                type="text"
                value={user.nationality || ""}
                onChange={(e) => setUser({ ...user, nationality: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter nationality"
              />
            </div>
          </div>
        </section>
        {/* Employment Details */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Employment Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Department */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <FiBriefcase size={14} /> Department
              </label>
              <select
                value={user.department || ""}
                onChange={(e) => setUser({ ...user, department: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            {/* Designation */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Designation</label>
              <input
                type="text"
                value={user.designation || ""}
                onChange={(e) => setUser({ ...user, designation: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter designation"
              />
            </div>
            {/* Joining Date */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Joining Date</label>
              <input
                type="date"
                value={
                  user.date_joined && /^\d{4}-\d{2}-\d{2}$/.test(user.date_joined)
                    ? user.date_joined
                    : (user.date_joined && !isNaN(Date.parse(user.date_joined))
                        ? new Date(user.date_joined).toISOString().slice(0, 10)
                        : "")
                }
                onChange={(e) => setUser({ ...user, date_joined: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter joining date"
              />
            </div>
            {/* Employee ID */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Employee ID</label>
              <input
                type="text"
                value={user.emp_id || ""}
                onChange={(e) => setUser({ ...user, emp_id: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter employee ID"
              />
            </div>
            {/* Employment Type */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Employment Type</label>
              <input
                type="text"
                value={user.employment_type || ""}
                onChange={(e) => setUser({ ...user, employment_type: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter employment type"
              />
            </div>
            {/* Work Location */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Work Location</label>
              <input
                type="text"
                value={user.work_location || ""}
                onChange={(e) => setUser({ ...user, work_location: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter work location"
              />
            </div>
            {/* Team */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Team</label>
              <input
                type="text"
                value={user.team || ""}
                onChange={(e) => setUser({ ...user, team: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter team"
              />
            </div>
            {/* Reports To */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Reports To</label>
              <input
                type="text"
                value={user.reports_to || ""}
                onChange={(e) => setUser({ ...user, reports_to: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter reports to"
              />
            </div>
          </div>
        </section>
        {/* Education & Skills */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Education &amp; Skills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Degree */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <input
                type="text"
                value={user.degree || ""}
                onChange={(e) => setUser({ ...user, degree: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter degree"
              />
            </div>
            {/* Degree Passout Year */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Degree Passout Year</label>
              <input
                type="text"
                value={user.degree_passout_year || ""}
                onChange={(e) => setUser({ ...user, degree_passout_year: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter degree passout year"
              />
            </div>
            {/* Institution */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Institution</label>
              <input
                type="text"
                value={user.institution || ""}
                onChange={(e) => setUser({ ...user, institution: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter institution"
              />
            </div>
            {/* Grade */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Grade</label>
              <input
                type="text"
                value={user.grade || ""}
                onChange={(e) => setUser({ ...user, grade: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter grade"
              />
            </div>
            {/* Skills */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Skills</label>
              <input
                type="text"
                value={user.skills || ""}
                onChange={(e) => setUser({ ...user, skills: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter skills"
              />
            </div>
            {/* Languages */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Languages</label>
              <input
                type="text"
                value={user.languages || ""}
                onChange={(e) => setUser({ ...user, languages: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter languages"
              />
            </div>
          </div>
        </section>
        {/* Emergency Contact */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Emergency Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Emergency Contact Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Contact Name</label>
              <input
                type="text"
                value={user.emergency_contact_name || ""}
                onChange={(e) => setUser({ ...user, emergency_contact_name: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter emergency contact name"
              />
            </div>
            {/* Emergency Contact Relationship */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Relationship</label>
              <input
                type="text"
                value={user.emergency_contact_relationship || ""}
                onChange={(e) => setUser({ ...user, emergency_contact_relationship: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter relationship"
              />
            </div>
            {/* Emergency Contact Number */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <input
                type="text"
                value={user.emergency_contact_no || ""}
                onChange={(e) => setUser({ ...user, emergency_contact_no: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter emergency contact number"
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
        </section>
        {/* Addresses */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Addresses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Current Address */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Current Address</label>
              <input
                type="text"
                value={user.current_address || ""}
                onChange={(e) => setUser({ ...user, current_address: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter current address"
              />
            </div>
            {/* Permanent Address */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Permanent Address</label>
              <input
                type="text"
                value={user.permanent_address || ""}
                onChange={(e) => setUser({ ...user, permanent_address: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter permanent address"
              />
            </div>
          </div>
        </section>
        {/* Buttons */}
        {!isEditing ? (
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => {
                setOriginalUser(user);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 text-sm sm:text-base font-medium 
              rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-blue-500 
              text-white hover:from-blue-700 hover:to-blue-600 
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 
              transition-all duration-200"
            >
              <FiEdit size={16} /> Edit Profile
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 
              bg-white shadow-sm font-medium hover:bg-gray-100 
              focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1
              transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium 
              bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md
              hover:from-blue-700 hover:to-blue-600
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200"
            >
              {isSaving ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <FiSave size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        )}
        <Docs />
      </div>
    </DashboardLayout>
  );
}
