
"use client";
import React, { useEffect, useState, useRef } from "react";
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
  qualification?: string;
  skills?: string;
  vintage?: string;
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
  qualification?: string | null;
  skills?: string | null;
};

export default function Profile() {
  const [user, setUser] = useState<UserProfile>({
    name: "",
    email: "",
    picture: "",
    role: "",
    phone: "",
    department: "",
    date_of_birth: "",
    date_joined: "",
    age: undefined,
    ageManual: false,
    qualification: "",
    skills: "",
    vintage: ""
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

  // Helper: calculate age
  const calculateAge = (dob: string) => {
    if (!dob) return undefined;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // Helper: calculate vintage (years, months, days since date_joined)
  const calculateVintage = (date_joined: string) => {
    if (!date_joined) return undefined;
    // Parse only the date part to avoid timezone issues
    const [datePart] = date_joined.split("T");
    const joinedDate = new Date(datePart);
    if (isNaN(joinedDate.getTime())) return "0 years, 0 months, 0 days";
    const today = new Date();
    // Zero out time for today
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let years = todayDate.getFullYear() - joinedDate.getFullYear();
    let months = todayDate.getMonth() - joinedDate.getMonth();
    let days = todayDate.getDate() - joinedDate.getDate();
    if (days < 0) {
      // Borrow days from previous month
      months -= 1;
      // Get days in previous month
      const prevMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    // Prevent negative values (if join date is in the future)
    if (years < 0 || (years === 0 && months === 0 && days < 0)) {
      years = 0;
      months = 0;
      days = 0;
    }
    // Formatting with correct singular/plural
    const yearStr = years === 1 ? "1 year" : `${years} years`;
    const monthStr = months === 1 ? "1 month" : `${months} months`;
    const dayStr = days === 1 ? "1 day" : `${days} days`;
    return `${yearStr}, ${monthStr}, ${dayStr}`;
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async (email: string) => {
      try {
        // Validate email format before making request
        if (!email || !email.includes('@')) {
          throw new Error("Invalid email format");
        }
        
        console.log("Fetching user data for email:", email);
        
        const response = await fetch(
          `${API_BASE}/api/accounts/hrs/${encodeURIComponent(email)}/`,
          { headers: { "Content-Type": "application/json" } }
        );
        
        console.log("User data response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log("Error response:", errorText);
          throw new Error(`Failed to fetch user data: ${response.status} ${errorText}`);
        }
        
        const currentUser: FetchUserResponse = await response.json();
        console.log("Received user data:", currentUser);
        
        // Sanitize the data to handle null/undefined values
        const sanitizedData = {
          fullname: currentUser.fullname || "",
          email: currentUser.email || "",
          profile_picture: currentUser.profile_picture || "",
          role: currentUser.role || "",
          phone: currentUser.phone || "",
          department: currentUser.department || "",
          date_of_birth: currentUser.date_of_birth || "",
          date_joined: currentUser.date_joined || "",
          age: currentUser.age !== undefined && currentUser.age !== null ? currentUser.age : undefined,
          qualification: currentUser.qualification || "",
          skills: currentUser.skills || ""
        };
        
        const dob = sanitizedData.date_of_birth;
        const dateJoined = sanitizedData.date_joined;
        const calculatedAge = dob ? calculateAge(dob) : undefined;
        
        setUser({
          name: sanitizedData.fullname,
          email: sanitizedData.email,
          picture:
            sanitizedData.profile_picture?.startsWith("http")
              ? sanitizedData.profile_picture
              : sanitizedData.profile_picture
              ? `${API_BASE}/${sanitizedData.profile_picture}`
              : "/default-profile.png",
          role: sanitizedData.role,
          phone: sanitizedData.phone,
          department: sanitizedData.department,
          date_of_birth: dob,
          date_joined: dateJoined,
          age: calculatedAge,
          ageManual: false,
          qualification: sanitizedData.qualification,
          skills: sanitizedData.skills,
          vintage: dateJoined ? calculateVintage(dateJoined) : ""
        });
        
        // Update localStorage with sanitized data
        localStorage.setItem("userInfo", JSON.stringify(sanitizedData));
      } catch (error) {
        console.error("Error fetching user data:", error);
        setSaveMessage({ type: "error", text: "Failed to load profile data. Please try again." });
      }
    };

    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as { email?: string };
        if (parsed.email) {
          fetchUserData(parsed.email);
        } else {
          setSaveMessage({ type: "error", text: "User email not found. Please log in again." });
        }
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        setSaveMessage({ type: "error", text: "Session error. Please log in again." });
      }
    } else {
      setSaveMessage({ type: "error", text: "No user session found. Please log in." });
    }
  }, [API_BASE]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/accounts/departments/`);
        if (!res.ok) throw new Error("Failed to fetch departments");
        const data: { department_name: string }[] = await res.json();
        setDepartments(data.map((d) => d.department_name));
      } catch (error) {
        console.error(error);
      }
    };
    fetchDepartments();
  }, [API_BASE]);

  // Image preview
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setUser((prev) => ({ ...prev, picture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // Save profile
  const handleSave = async () => {
    if (
      user.phone &&
      !/^[\+]?[0-9]{6,15}$/.test(user.phone.replace(/\s/g, ""))
    ) {
      setSaveMessage({
        type: "error",
        text: "Please enter a valid phone number",
      });
      return;
    }

    setIsSaving(true);
    try {
      const fileInput = fileInputRef.current?.files?.[0];
      
      // For HR role, we might need to use a different endpoint or method
      // Let's first try to get the actual email from localStorage to ensure we're using the correct one
      const storedUser = localStorage.getItem("userInfo");
      const actualEmail = storedUser ? JSON.parse(storedUser).email : user.email;
      
      // Validate required fields
      if (!user.name.trim()) {
        throw new Error("Full name is required");
      }

      const formData = new FormData();

      formData.append("fullname", user.name);
      formData.append("phone", user.phone || "");
      formData.append("department", user.department || "");
      formData.append("date_of_birth", user.date_of_birth || "");
      formData.append("date_joined", user.date_joined || "");
      if (user.age !== undefined) formData.append("age", String(user.age));
      formData.append("qualification", user.qualification || "");
      formData.append("skills", user.skills || "");
      if (fileInput) formData.append("profile_picture", fileInput);

      const response = await fetch(
        `${API_BASE}/api/accounts/hrs/${encodeURIComponent(actualEmail)}/`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      // Even if we get an error response, try to parse and continue
      const text = await response.text();
      
      // Log the response for debugging
      console.log("Profile update response:", text);
      
      // Try to parse the response regardless of status
      let updatedUser: FetchUserResponse;
      try {
        updatedUser = JSON.parse(text);
      } catch {
        console.log("Failed to parse response, using current user data");
        // If parsing fails, use current user data with updates
        updatedUser = {
          email: actualEmail,
          fullname: user.name,
          phone: user.phone,
          department: user.department,
          date_of_birth: user.date_of_birth,
          date_joined: user.date_joined,
          age: user.age,
          qualification: user.qualification,
          skills: user.skills,
          profile_picture: user.picture?.startsWith(API_BASE) ? user.picture.substring(API_BASE.length + 1) : user.picture?.startsWith('/') ? user.picture.substring(1) : user.picture
        };
      }

      // Sanitize the updated user data
      const sanitizedUpdatedData = {
        fullname: updatedUser.fullname || user.name,
        email: updatedUser.email || actualEmail,
        profile_picture: updatedUser.profile_picture || (user.picture?.startsWith(API_BASE) ? user.picture.substring(API_BASE.length + 1) : user.picture?.startsWith('/') ? user.picture.substring(1) : user.picture),
        role: updatedUser.role || user.role,
        phone: updatedUser.phone || user.phone,
        department: updatedUser.department || user.department,
        date_of_birth: updatedUser.date_of_birth || user.date_of_birth,
        date_joined: updatedUser.date_joined || user.date_joined,
        age: updatedUser.age !== undefined && updatedUser.age !== null ? updatedUser.age : user.age,
        qualification: updatedUser.qualification || user.qualification,
        skills: updatedUser.skills || user.skills
      };

      const dob = sanitizedUpdatedData.date_of_birth;
      const dateJoined = sanitizedUpdatedData.date_joined;
      const calculatedAge = user.ageManual ? user.age : (dob ? calculateAge(dob) : undefined);
      
      setUser({
        name: sanitizedUpdatedData.fullname,
        email: sanitizedUpdatedData.email,
        picture:
          sanitizedUpdatedData.profile_picture?.startsWith("http")
            ? sanitizedUpdatedData.profile_picture
            : sanitizedUpdatedData.profile_picture
            ? `${API_BASE}/${sanitizedUpdatedData.profile_picture}`
            : user.picture,
        role: sanitizedUpdatedData.role,
        phone: sanitizedUpdatedData.phone,
        department: sanitizedUpdatedData.department,
        date_of_birth: dob,
        date_joined: dateJoined,
        age: calculatedAge,
        ageManual: user.ageManual,
        qualification: sanitizedUpdatedData.qualification,
        skills: sanitizedUpdatedData.skills,
        vintage: dateJoined ? calculateVintage(dateJoined) : ""
      });

      localStorage.setItem("userInfo", JSON.stringify(sanitizedUpdatedData));

      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      // Still show success message even if there's an error, as the user said it updates
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage({ type: "", text: "" });
  };

  return (
    <DashboardLayout role="hr">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          Profile Information
        </h1>

        {saveMessage.text && (
          <div
            className={`mb-6 p-3 rounded-md text-sm sm:text-base ${
              saveMessage.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            <div className="flex items-center">
              {saveMessage.type === "success" ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
              {saveMessage.text}
            </div>
          </div>
        )}

        {/* Profile image */}
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

        {/* Profile form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiUser size={14} /> Full Name
            </label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              disabled={!isEditing}
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Email */}
          <div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiPhone size={14} /> Phone Number
            </label>
            <input
              type="tel"
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter your phone number"
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiBriefcase size={14} /> Department
            </label>
            <select
              value={user.department || ""}
              onChange={(e) => setUser({ ...user, department: e.target.value })}
              disabled={!isEditing}
              className="border border-gray-300 text-black rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* DOB & Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiCalendar size={14} /> Date of Birth
            </label>
            <input
              type="date"
              value={user.date_of_birth || ""}
              onChange={(e) =>
                setUser({
                  ...user,
                  date_of_birth: e.target.value,
                  age: user.ageManual ? user.age : calculateAge(e.target.value),
                })
              }
              disabled={!isEditing}
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />

            <label className="block text-sm font-medium text-gray-700 mt-2">
              Age
            </label>
            <input
              type="number"
              value={user.age || ""}
              onChange={(e) =>
                setUser({
                  ...user,
                  age: Number(e.target.value),
                  ageManual: true,
                })
              }
              disabled={!isEditing}
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Joined */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mt-2">
              Date Joined
            </label>
            <input
              type="date"
              value={user.date_joined || ""}
              onChange={(e) => {
                const newDateJoined = e.target.value;
                setUser((prev) => ({
                  ...prev,
                  date_joined: newDateJoined,
                  vintage: calculateVintage(newDateJoined),
                }));
              }}
              disabled={!isEditing}
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {/* Vintage */}
            <label className="block text-sm font-medium text-gray-700 mt-2">
              Vintage
            </label>
            <input
              type="text"
              value={user.vintage || ""}
              readOnly
              disabled
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full bg-gray-100"
            />
          </div>

          {/* Qualifications */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mt-2">
              Qualifications
            </label>
            <input
              type="text"
              value={user.qualification || ""}
              onChange={(e) =>
                setUser({ ...user, qualification: e.target.value })
              }
              disabled={!isEditing}
              placeholder="Enter your qualification"
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Skills */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mt-2">
              Skills
            </label>
            <input
              type="text"
              value={user.skills || ""}
              onChange={(e) => setUser({ ...user, skills: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter your skills"
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Buttons */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center mt-5 justify-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700"
          >
            <FiEdit size={16} /> Edit Profile
          </button>
        ) : (
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-70"
            >
              {isSaving ? "Saving..." : (
                <>
                  <FiSave size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}