"use client";
import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
  name: string;
  email: string;
  picture?: string;
  role: string;
  phone?: string;
  department?: string;
};

export default function Profile() {
  const [user, setUser] = useState<UserProfile>({
    name: "",
    email: "",
    picture: "",
    role: "",
    phone: "",
    department: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Load user info from localStorage when component mounts
  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUser({ ...user, picture: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (
      user.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(user.phone.replace(/\s/g, ""))
    ) {
      setSaveMessage({
        type: "error",
        text: "Please enter a valid phone number",
      });
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      localStorage.setItem("userInfo", JSON.stringify(user));
      setIsSaving(false);
      setIsEditing(false);
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });

      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
    }, 800);
  };

  const handleCancel = () => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsEditing(false);
    setSaveMessage({ type: "", text: "" });
  };

  return (
    <DashboardLayout role="employee">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Profile Information
          </h1>
        </div>

        {/* Save Message */}
        {saveMessage.text && (
          <div
            className={`mb-6 p-3 rounded-md text-sm sm:text-base ${
              saveMessage.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Profile Info */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          {/* Profile Picture */}
          <div className="relative flex-shrink-0">
            <img
              src={user.picture || "/default-profile.png"}
              alt={user.name || "Profile"}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-blue-500 shadow-md object-cover"
            />
            {isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full shadow-md hover:bg-blue-600 transition-colors"
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

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiUser size={14} />
              Full Name
            </label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              disabled={!isEditing}
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiMail size={14} />
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiPhone size={14} />
              Phone Number
            </label>
            <input
              type="tel"
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter your phone number"
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiBriefcase size={14} />
              Department
            </label>
            <select
              value={user.department || ""}
              onChange={(e) => setUser({ ...user, department: e.target.value })}
              disabled={!isEditing}
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center mt-5 justify-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiEdit size={16} />
            Edit Profile
          </button>
        ) : null}

        {/* Action Buttons */}
        {isEditing && (
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <FiSave size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
