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
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

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

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async (email: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/managers/${encodeURIComponent(
            email
          )}/`,
          { headers: { "Content-Type": "application/json" } }
        );
        if (!response.ok) throw new Error("Failed to fetch user data");
        const currentUser = await response.json();
        setUser({
          name: currentUser.fullname || "",
          email: currentUser.email || email,
          picture: currentUser.profile_picture || "/default-profile.png",
          role: currentUser.role || "",
          phone: currentUser.phone || "",
          department: currentUser.department || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setSaveMessage({ type: "error", text: "Failed to load profile data." });
      }
    };

    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.email) fetchUserData(parsed.email);
    }
  }, []);

  // Image preview
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUser((prev) => ({ ...prev, picture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // Save profile
  const handleSave = async () => {
    if (user.phone && !/^[\+]?[0-9]{6,15}$/.test(user.phone.replace(/\s/g, ""))) {
      setSaveMessage({ type: "error", text: "Please enter a valid phone number" });
      return;
    }

    setIsSaving(true);
    try {
      let profilePictureUrl = user.picture || "";

      // Upload new picture to Supabase
      const fileInput = fileInputRef.current?.files?.[0];
      if (fileInput && user.email) {
        const fileExt = fileInput.name.split(".").pop();
        const fileName = `${user.email.replace(/[@.]/g, "_")}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, fileInput, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName);

        profilePictureUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      }

      // PUT request
      const response = await fetch(
       `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/managers/${encodeURIComponent(user.email)}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            fullname: user.name,
            phone: user.phone,
            department: user.department,
            profile_picture: profilePictureUrl,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update profile");
      const updatedUser = await response.json();

      setUser({
        name: updatedUser.fullname || user.name,
        email: updatedUser.email || user.email,
        picture: updatedUser.profile_picture || profilePictureUrl,
        role: updatedUser.role || user.role,
        phone: updatedUser.phone || user.phone,
        department: updatedUser.department || user.department,
      });

      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error: any) {
      console.error(error);
      setSaveMessage({ type: "error", text: error.message || "Failed to save profile changes." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage({ type: "", text: "" });
  };

  return (
    <DashboardLayout role="manager">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Profile Information
          </h1>
        </div>

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

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiUser size={14} /> Full Name
            </label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              disabled={!isEditing}
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

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

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <FiPhone size={14} /> Phone Number
            </label>
            <input
              type="tel"
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter your phone number"
              className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

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
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center mt-5 justify-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
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
              {isSaving ? "Saving..." : <><FiSave size={16} /> Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}