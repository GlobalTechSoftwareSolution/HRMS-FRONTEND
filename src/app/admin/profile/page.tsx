"use client";
import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiSave, FiEdit, FiUser, FiPhone, FiBriefcase, FiMail, FiCamera } from "react-icons/fi";
import { supabase } from "@/app/lib/supabaseClient";

type UserProfile = {
  name: string;
  email: string;
  picture?: string;
  phone?: string;
  office_address?: string;
};

function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile>({ name: "", email: "", picture: "", phone: "", office_address: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUser(prev => ({ ...prev, picture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let profilePictureUrl = user.picture;

      if (user.picture?.startsWith("data:image/")) {
        const ext = user.picture.substring(user.picture.indexOf("/") + 1, user.picture.indexOf(";"));
        const timestamp = Date.now();
        const fileName = `${user.email}-profile-${timestamp}.${ext}`;
        const file = dataURLtoFile(user.picture, fileName);

        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        profilePictureUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-pictures/${fileName}`;
      }

      const { data, error } = await supabase
        .from("accounts_admin")
        .upsert({
          email_id: user.email,
          fullname: user.name,
          phone: user.phone || null,
          office_address: user.office_address || null,
          profile_picture: profilePictureUrl || null,
        });

      if (error) throw error;

      const updatedUser = { ...user, picture: profilePictureUrl };
      setUser(updatedUser);
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setIsEditing(false);
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
    } catch (err: any) {
      console.error("Supabase Upsert Error:", JSON.stringify(err, null, 2));
      setSaveMessage({ type: "error", text: "Failed to update profile. Try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsEditing(false);
    setSaveMessage({ type: "", text: "" });
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">Profile Information</h1>

        {saveMessage.text && (
          <div className={`mb-6 p-3 rounded-md text-sm sm:text-base ${saveMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full shadow-md hover:bg-blue-600 transition-colors">
                  <FiCamera size={14} />
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiUser size={14}/> Full Name</label>
            <input type="text" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} disabled={!isEditing} className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiMail size={14}/> Email Address</label>
            <input type="email" value={user.email} disabled className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full bg-gray-100 cursor-not-allowed" />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiPhone size={14}/> Phone Number</label>
            <input type="tel" value={user.phone || ""} onChange={(e) => setUser({ ...user, phone: e.target.value })} disabled={!isEditing} placeholder="Enter phone number" className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><FiBriefcase size={14}/> Department</label>
            <input type="text" value={user.office_address || ""} onChange={(e) => setUser({ ...user, office_address: e.target.value })} disabled={!isEditing} placeholder="Enter department" className="border border-gray-300 rounded-md p-2.5 sm:p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" />
          </div>
        </div>

        {!isEditing && <button onClick={() => setIsEditing(true)} className="flex items-center mt-5 justify-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"><FiEdit size={16}/> Edit Profile</button>}

        {isEditing && (
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={handleCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
              {isSaving ? "Saving..." : <><FiSave size={16}/> Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
