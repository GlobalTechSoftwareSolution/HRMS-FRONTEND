"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { FiSave, FiEdit, FiUser, FiPhone, FiMail, FiMapPin, FiCamera } from "react-icons/fi";

type AdminProfile = {
  fullname: string;
  email: string;
  phone?: string;
  office_address?: string;
  profile_picture?: string;
};

export default function Profile() {
  const [admin, setAdmin] = useState<AdminProfile>({
    fullname: "",
    email: "",
    phone: "",
    office_address: "",
    profile_picture: "/default-profile.png",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ✅ Fetch admin data based on logged-in email
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        // Get logged-in email from localStorage (or your auth method)
        const storedUser = localStorage.getItem("userInfo");
        const userEmail = storedUser ? JSON.parse(storedUser).email : null;
        if (!userEmail) throw new Error("No logged-in email found");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/admins/${encodeURIComponent(userEmail)}/`
        );
        if (!response.ok) throw new Error("Failed to fetch admin details");

        const adminData = await response.json();
        setAdmin({
          fullname: adminData.fullname || "",
          email: adminData.email || userEmail,
          phone: adminData.phone || "",
          office_address: adminData.office_address || "",
          profile_picture: adminData.profile_picture || "/default-profile.png",
        });
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: "Failed to load admin profile." });
      }
    };

    fetchAdmin();
  }, []);

  // ✅ Preview new profile image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => setAdmin((prev) => ({ ...prev, profile_picture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // ✅ Save updated admin data using FormData
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append("fullname", admin.fullname);
      formData.append("phone", admin.phone || "");
      formData.append("office_address", admin.office_address || "");
      if (selectedFile) {
        formData.append("profile_picture", selectedFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/admins/${encodeURIComponent(admin.email)}/`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (!response.ok) {
        console.error("PATCH failed:", response.status, await response.text());
        throw new Error("Failed to update admin profile");
      }

      const updated = await response.json();
      setAdmin(updated);
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage({ type: "", text: "" });
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Admin Profile</h1>

        {message.text && (
          <div
            className={`p-3 mb-6 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <Image
              src={admin.profile_picture || "/default-profile.png"}
              alt={admin.fullname}
              width={120}
              height={120}
              className="rounded-full border-2 border-blue-500 shadow-md object-cover"
              unoptimized
            />
            {isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600 transition-colors"
                >
                  <FiCamera size={16} />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FiUser size={14} /> Full Name
            </label>
            <input
              type="text"
              value={admin.fullname}
              onChange={(e) => setAdmin({ ...admin, fullname: e.target.value })}
              disabled={!isEditing}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FiMail size={14} /> Email
            </label>
            <input
              type="email"
              value={admin.email}
              disabled
              className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FiPhone size={14} /> Phone
            </label>
            <input
              type="tel"
              value={admin.phone || ""}
              onChange={(e) => setAdmin({ ...admin, phone: e.target.value })}
              disabled={!isEditing}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Enter phone number"
            />
          </div>

          {/* Office Address */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FiMapPin size={14} /> Office Address
            </label>
            <input
              type="text"
              value={admin.office_address || ""}
              onChange={(e) => setAdmin({ ...admin, office_address: e.target.value })}
              disabled={!isEditing}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Enter office address"
            />
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
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