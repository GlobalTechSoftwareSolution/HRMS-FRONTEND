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
  // Additional fields from API
  blood_group?: string;
  account_number?: string;
  father_name?: string;
  father_contact?: string;
  mother_name?: string;
  mother_contact?: string;
  wife_name?: string;
  home_address?: string;
  total_siblings?: string;
  brothers?: string;
  sisters?: string;
  total_children?: string;
  bank_name?: string;
  branch?: string;
  pf_no?: string;
  pf_uan?: string;
  ifsc?: string;
  residential_address?: string;
};


export default function Profile() {
  // Managers array: id, fullname, email
  const [managers, setManagers] = useState<{id: string; fullname: string; email: string;}[]>([]);
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
    blood_group: "",
    account_number: "",
    father_name: "",
    father_contact: "",
    mother_name: "",
    mother_contact: "",
    wife_name: "",
    home_address: "",
    total_siblings: "",
    brothers: "",
    sisters: "",
    total_children: "",
    bank_name: "",
    branch: "",
    pf_no: "",
    pf_uan: "",
    ifsc: "",
    residential_address: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  // Store original user for Cancel
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AGE and VINTAGE states
  const [age, setAge] = useState<string>("");
  const [vintage, setVintage] = useState<string>("");

  // Calculate age in years, months, days
  function calculateAge(dateString: string | undefined): string {
    if (!dateString) return "";
    const dob = new Date(dateString);
    if (isNaN(dob.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();
    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 0) return "";
    // Always display all three values (even if zero)
    const yearStr = `${years} year${years !== 1 ? "s" : ""}`;
    const monthStr = `${months} month${months !== 1 ? "s" : ""}`;
    const dayStr = `${days} day${days !== 1 ? "s" : ""}`;
    return `${yearStr}, ${monthStr}, ${dayStr}`;
  }

  // Calculate vintage: years, months, days since joining
  function calculateVintage(dateString: string | undefined): string {
    if (!dateString) return "";
    const joined = new Date(dateString);
    if (isNaN(joined.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - joined.getFullYear();
    let months = today.getMonth() - joined.getMonth();
    let days = today.getDate() - joined.getDate();
    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 0) return "";
    // Always display all three values (even if zero)
    const yearStr = `${years} year${years !== 1 ? "s" : ""}`;
    const monthStr = `${months} month${months !== 1 ? "s" : ""}`;
    const dayStr = `${days} day${days !== 1 ? "s" : ""}`;
    return `${yearStr}, ${monthStr}, ${dayStr}`;
  }

  // Update age when date_of_birth changes
  useEffect(() => {
    setAge(calculateAge(user.date_of_birth));
  }, [user.date_of_birth]);

  // Update vintage when date_joined changes
  useEffect(() => {
    setVintage(calculateVintage(user.date_joined));
  }, [user.date_joined]);

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
            ? currentUser.profile_picture.replace(/^"|"$/g, "").replace(/@/g, "%40")
            : "",
          gender: typeof currentUser.gender === "string" ? currentUser.gender : "",
          marital_status: typeof currentUser.marital_status === "string" ? currentUser.marital_status : "",
          nationality: typeof currentUser.nationality === "string" ? currentUser.nationality : "",
          permanent_address: typeof currentUser.permanent_address === "string" ? currentUser.permanent_address : "",
          emergency_contact_name: typeof currentUser.emergency_contact_name === "string" ? currentUser.emergency_contact_name : "",
          emergency_contact_relationship: typeof currentUser.emergency_contact_relationship === "string" ? currentUser.emergency_contact_relationship : "",
          emergency_contact_no: typeof currentUser.emergency_contact_no === "string" ? currentUser.emergency_contact_no : "",
          emp_id: typeof currentUser.emp_id === "string" ? currentUser.emp_id : "",
          employment_type: typeof currentUser.employment_type === "string" ? currentUser.employment_type : "",
          work_location: typeof currentUser.work_location === "string" ? currentUser.work_location : "",
          team: typeof currentUser.team === "string" ? currentUser.team : "",
          degree: typeof currentUser.degree === "string" ? currentUser.degree : "",
          degree_passout_year: currentUser.degree_passout_year !== undefined ? String(currentUser.degree_passout_year) : "",
          institution: typeof currentUser.institution === "string" ? currentUser.institution : "",
          grade: typeof currentUser.grade === "string" ? currentUser.grade : "",
          languages: typeof currentUser.languages === "string" ? currentUser.languages : "",
          reports_to: typeof currentUser.reports_to === "string" ? currentUser.reports_to : "",
          // Additional fields from API
          blood_group: typeof currentUser.blood_group === "string" ? currentUser.blood_group : "",
          account_number: typeof currentUser.account_number === "string" ? currentUser.account_number : "",
          father_name: typeof currentUser.father_name === "string" ? currentUser.father_name : "",
          father_contact: typeof currentUser.father_contact === "string" ? currentUser.father_contact : "",
          mother_name: typeof currentUser.mother_name === "string" ? currentUser.mother_name : "",
          mother_contact: typeof currentUser.mother_contact === "string" ? currentUser.mother_contact : "",
          wife_name: typeof currentUser.wife_name === "string" ? currentUser.wife_name : "",
          home_address: typeof currentUser.home_address === "string" ? currentUser.home_address : "",
          total_siblings: currentUser.total_siblings !== undefined ? String(currentUser.total_siblings) : "",
          brothers: currentUser.brothers !== undefined ? String(currentUser.brothers) : "",
          sisters: currentUser.sisters !== undefined ? String(currentUser.sisters) : "",
          total_children: currentUser.total_children !== undefined ? String(currentUser.total_children) : "",
          bank_name: typeof currentUser.bank_name === "string" ? currentUser.bank_name : "",
          branch: typeof currentUser.branch === "string" ? currentUser.branch : "",
          pf_no: typeof currentUser.pf_no === "string" ? currentUser.pf_no : "",
          pf_uan: typeof currentUser.pf_uan === "string" ? currentUser.pf_uan : "",
          ifsc: typeof currentUser.ifsc === "string" ? currentUser.ifsc : "",
          residential_address: typeof currentUser.residential_address === "string" ? currentUser.residential_address : "",
        };
        setUser(loadedUser);
        setOriginalUser(loadedUser);
      } catch {
        setSaveMessage({ type: "error", text: "Failed to load profile data." });
      }
    };

    // Fetch managers list
    const fetchManagers = async () => {
      try {
        // Adjust API endpoint as needed for your backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/?is_manager=true`, {
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error("Failed to fetch managers list");
        const data = await response.json();
        // Assume data is an array of {id, fullname, email}
        setManagers(Array.isArray(data) ? data : []);
      } catch {
        setManagers([]);
      }
    };

    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as { email?: string };
      if (parsed.email) {
        fetchUserData(parsed.email);
        fetchManagers();
      }
    }
  }, []);

  // Image preview (with local preview, robust to backend error)
  const [localProfilePic, setLocalProfilePic] = useState<string | null>(null);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // For debugging: log file
    const reader = new FileReader();
    reader.onload = () => {
      setLocalProfilePic(reader.result as string);
      setUser((prev) => ({ ...prev, profile_picture: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Save profile
 const handleSave = async () => {
   setIsSaving(true);
   try {
     const fileInput = fileInputRef.current?.files?.[0];
     // List of allowed fields (including additional info fields)
     const allowedFields: (keyof UserProfile)[] = [
       "fullname", "phone", "department", "designation", "date_of_birth",
       "date_joined", "skills", "gender", "marital_status", "nationality",
       "permanent_address", "emp_id", "employment_type", "work_location",
       "team", "reports_to", "degree", "degree_passout_year", "institution",
       "grade", "languages", "emergency_contact_name",
       "emergency_contact_relationship",
       "emergency_contact_no",
       "blood_group", "account_number", "father_name", "father_contact",
       "mother_name", "mother_contact", "wife_name", "home_address",
       "total_siblings", "brothers", "sisters", "total_children",
       "bank_name", "branch", "pf_no", "pf_uan", "ifsc", "residential_address",
     ];
     // Numeric fields to convert
     const numericFields: (keyof UserProfile)[] = [
       "total_siblings", "brothers", "sisters", "total_children", "degree_passout_year"
     ];
     const formData = new FormData();
     // Only append the selected profile picture file (not the base64 string)
     if (fileInput) {
       formData.append("profile_picture", fileInput);
     }

     // Prepare a copy of user with reports_to as manager ID
     let reportsToValue = user.reports_to || "";
     // If the value is not empty and managers are loaded
     if (reportsToValue && managers.length > 0) {
       // Try to find manager by ID (if already an ID), else by email or fullname
       const manager =
         managers.find((m) => m.id === reportsToValue) ||
         managers.find((m) => m.email === reportsToValue) ||
         managers.find((m) => m.fullname === reportsToValue);
       reportsToValue = manager ? manager.id : "";
     }

     allowedFields.forEach((field) => {
       // Don't send localProfilePic (used only for preview)
       if (field === "profile_picture") return;
       const value = user[field];
       // Special handling for reports_to: send manager ID
       if (field === "reports_to") {
         if (reportsToValue && typeof reportsToValue === "string" && reportsToValue.trim() !== "") {
           formData.append("reports_to", reportsToValue);
         }
         return;
       }
       // Convert numeric fields to numbers if not empty
       if (numericFields.includes(field)) {
         if (typeof value === "string" && value.trim() !== "") {
           const num = Number(value);
           if (!isNaN(num)) {
             formData.append(field, num.toString());
           }
         }
       } else {
         if (typeof value === "string" && value.trim() !== "") {
           formData.append(field, value);
         }
       }
     });
     // Do NOT append email to FormData (handled by backend, avoid ForeignKey assignment error)
     // if (user.email && user.email.trim() !== "") {
     //   formData.append("email", user.email);
     // }
     const fetchOptions: RequestInit = {
       method: "PATCH",
       body: formData,
       // Do NOT set Content-Type, browser handles boundary for FormData
     };
     const fetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(user.email)}/`;
     const response = await fetch(
       fetchUrl,
       fetchOptions
     );
     // Log backend response status and text before parsing
     const responseText = await response.text();
     let data;
     let isJSON = false;
     try {
       data = JSON.parse(responseText);
       isJSON = true;
     } catch {
       data = null;
       isJSON = false;
     }
     if (!response.ok) {
       // If backend returned HTML (not JSON), show a generic error
       let errorMsg = "An error occurred while saving your profile.";
       if (isJSON && data?.error) {
         errorMsg = data.error;
       } else if (
         typeof responseText === "string" &&
         (responseText.startsWith("<!DOCTYPE html") ||
           responseText.startsWith("<html"))
       ) {
         errorMsg = "Server error. Please try again later.";
       } else if (typeof responseText === "string" && responseText.trim() !== "") {
         // Show up to 200 chars of text, but not HTML
         errorMsg = responseText.length > 500
           ? responseText.slice(0, 500)
           : responseText;
       }
       setSaveMessage({
         type: "error",
         text: errorMsg,
       });
       setIsSaving(false);
       // Don't clear local image preview if backend fails
       return;
     }
     // Merge backend response into user, but don't overwrite local image preview with broken/HTML data
     setUser((prev) => {
       // If localProfilePic is set, keep it as profile_picture for preview
       if (localProfilePic) {
         return { ...prev, ...data, profile_picture: localProfilePic };
       }
       return { ...prev, ...data };
     });
     setIsEditing(false);
     setSaveMessage({ type: "success", text: "Profile updated successfully!" });
     window.scrollTo({ top: 0, behavior: "smooth" });
     // Clear localProfilePic on successful save
     setLocalProfilePic(null);
   } catch (e: unknown) {
     setSaveMessage({
       type: "error",
       text: e instanceof Error ? e.message : "Failed to save profile",
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
    setLocalProfilePic(null);
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
      {/* Profile Picture Section */}
<section className="mb-8">
  <h2 className="text-lg font-semibold text-gray-700 mb-2">Profile Picture</h2>
  <div className="flex items-center gap-6">
    <div className="relative flex-shrink-0">
      {/* Profile image - only show if there is a profile picture */}
      {(localProfilePic || (user.profile_picture && user.profile_picture !== "null")) && (
        <Image
          src={
            localProfilePic
              ? localProfilePic
              : user.profile_picture!.replace(/^"|"$/g, "").replace(/@/g, "%40")
          }
          alt={user.fullname || "Profile"}
          width={96}
          height={96}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-blue-500 shadow-md object-cover"
          unoptimized={true}
          onError={() => {}}
        />
      )}
    </div>

    {/* Edit button */}
    {isEditing && (
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
      >
        <FiCamera size={16} />
        Edit
      </button>
    )}

    {/* Hidden file input */}
    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      onChange={handleImageUpload}
      className="hidden"
    />
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
              {/* Age Display */}
              <div className="mt-1">
                <label className="block text-xs font-medium text-gray-500">Age</label>
                <input
                  type="text"
                  value={age}
                  readOnly
                  className="border border-gray-200 rounded-md p-2.5 sm:p-3 w-full bg-gray-100 text-gray-700"
                  tabIndex={-1}
                  aria-label="Age in years, months, days"
                />
              </div>
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
              {/* Vintage Display */}
              <div className="mt-1">
                <label className="block text-xs font-medium text-gray-500">Vintage </label>
                <input
                  type="text"
                  value={vintage}
                  readOnly
                  className="border border-gray-200 rounded-md p-2.5 sm:p-3 w-full bg-gray-100 text-gray-700"
                  tabIndex={-1}
                  aria-label="Vintage in years, months, days"
                />
              </div>
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
              <select
                value={
                  // Show the manager ID if present, else fallback to empty string
                  user.reports_to && managers.some((m) => m.id === user.reports_to)
                    ? user.reports_to
                    : ""
                }
                onChange={(e) => {
                  setUser({ ...user, reports_to: e.target.value });
                }}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Manager</option>
                {managers.map((manager) => (
                  <option key={`${manager.id}-${manager.email}`} value={manager.id}>
                    {manager.fullname} ({manager.email})
                  </option>
                ))}
              </select>
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
            {/* Residential Address */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Residential Address</label>
              <input
                type="text"
                value={user.residential_address || ""}
                onChange={(e) => setUser({ ...user, residential_address: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter residential address"
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
        {/* Additional Information */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Additional Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Blood Group */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Blood Group</label>
              <input
                type="text"
                value={user.blood_group || ""}
                onChange={(e) => setUser({ ...user, blood_group: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter blood group"
              />
            </div>
            {/* Account Number */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Account Number</label>
              <input
                type="text"
                value={user.account_number || ""}
                onChange={(e) => setUser({ ...user, account_number: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter account number"
              />
            </div>
            {/* Father Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Father Name</label>
              <input
                type="text"
                value={user.father_name || ""}
                onChange={(e) => setUser({ ...user, father_name: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter father name"
              />
            </div>
            {/* Father Contact */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Father Contact</label>
              <input
                type="text"
                value={user.father_contact || ""}
                onChange={(e) => setUser({ ...user, father_contact: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter father contact"
              />
            </div>
            {/* Mother Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Mother Name</label>
              <input
                type="text"
                value={user.mother_name || ""}
                onChange={(e) => setUser({ ...user, mother_name: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter mother name"
              />
            </div>
            {/* Mother Contact */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Mother Contact</label>
              <input
                type="text"
                value={user.mother_contact || ""}
                onChange={(e) => setUser({ ...user, mother_contact: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter mother contact"
              />
            </div>
            {/* Wife Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Wife Name</label>
              <input
                type="text"
                value={user.wife_name || ""}
                onChange={(e) => setUser({ ...user, wife_name: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter wife name"
              />
            </div>
            {/* Home Address */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Home Address</label>
              <input
                type="text"
                value={user.home_address || ""}
                onChange={(e) => setUser({ ...user, home_address: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter home address"
              />
            </div>
            {/* Total Siblings */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Total Siblings</label>
              <input
                type="text"
                value={user.total_siblings || ""}
                onChange={(e) => setUser({ ...user, total_siblings: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter total siblings"
              />
            </div>
            {/* Brothers */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Brothers</label>
              <input
                type="text"
                value={user.brothers || ""}
                onChange={(e) => setUser({ ...user, brothers: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter number of brothers"
              />
            </div>
            {/* Sisters */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Sisters</label>
              <input
                type="text"
                value={user.sisters || ""}
                onChange={(e) => setUser({ ...user, sisters: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter number of sisters"
              />
            </div>
            {/* Total Children */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Total Children</label>
              <input
                type="text"
                value={user.total_children || ""}
                onChange={(e) => setUser({ ...user, total_children: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter total children"
              />
            </div>
            {/* Bank Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Bank Name</label>
              <input
                type="text"
                value={user.bank_name || ""}
                onChange={(e) => setUser({ ...user, bank_name: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter bank name"
              />
            </div>
            {/* Branch */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <input
                type="text"
                value={user.branch || ""}
                onChange={(e) => setUser({ ...user, branch: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter branch"
              />
            </div>
            {/* PF No */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">PF No</label>
              <input
                type="text"
                value={user.pf_no || ""}
                onChange={(e) => setUser({ ...user, pf_no: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter PF number"
              />
            </div>
            {/* PF UAN */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">PF UAN</label>
              <input
                type="text"
                value={user.pf_uan || ""}
                onChange={(e) => setUser({ ...user, pf_uan: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter PF UAN"
              />
            </div>
            {/* IFSC */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">IFSC</label>
              <input
                type="text"
                value={user.ifsc || ""}
                onChange={(e) => setUser({ ...user, ifsc: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter IFSC code"
              />
            </div>
            {/* Residential Address */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Residential Address</label>
              <input
                type="text"
                value={user.residential_address || ""}
                onChange={(e) => setUser({ ...user, residential_address: e.target.value })}
                disabled={!isEditing}
                className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter residential address"
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
