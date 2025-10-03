"use client";
import React, { useState, useEffect } from "react";
import { FiBook, FiTrendingUp, FiGlobe, FiEdit2, FiSave, FiPlus, FiX } from "react-icons/fi";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

type Education = {
  degree: string;
  institution: string;
  degree_passout_year: string;
  grade?: string;
};

interface User {
  email: string;
  fullname?: string;
  education?: Education[];
  skills?: string[];
  languages?: string[];
}

const EducationSkillsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newEducation, setNewEducation] = useState<Education>({
    degree: "",
    institution: "",
    degree_passout_year: "",
    grade: "",
  });

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem("userInfo");
      if (!storedUser) {
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(storedUser) as { email?: string };
      if (!parsed.email) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(
            parsed.email
          )}/`
        );
        
        const fetchedUser: User = {
          email: res.data.email,
          fullname: res.data.fullname,
          skills: res.data.skills ? JSON.parse(res.data.skills) : [],
          languages: res.data.languages ? JSON.parse(res.data.languages) : [],
          education: res.data.degree
            ? [
                {
                  degree: res.data.degree,
                  institution: res.data.institution,
                  degree_passout_year: res.data.degree_passout_year
                    ? res.data.degree_passout_year.toString()
                    : "",
                  grade: res.data.grade || "",
                },
              ]
            : [],
        };
        setUser(fetchedUser);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEducationChange = (field: keyof Education, value: string) => {
    setNewEducation((prev) => ({ ...prev, [field]: value }));
  };

  const addEducation = () => {
    if (
      newEducation.degree &&
      newEducation.institution &&
      newEducation.degree_passout_year
    ) {
      setUser((prev) =>
        prev
          ? { ...prev, education: [...(prev.education || []), { ...newEducation }] }
          : prev
      );
      setNewEducation({ degree: "", institution: "", degree_passout_year: "", grade: "" });
    }
  };

  const addSkill = () => {
    if (newSkill && !user?.skills?.includes(newSkill)) {
      setUser((prev) =>
        prev ? { ...prev, skills: [...(prev.skills || []), newSkill] } : prev
      );
      setNewSkill("");
    }
  };

  const addLanguage = () => {
    if (newLanguage && !user?.languages?.includes(newLanguage)) {
      setUser((prev) =>
        prev
          ? { ...prev, languages: [...(prev.languages || []), newLanguage] }
          : prev
      );
      setNewLanguage("");
    }
  };

  const removeItem = (
    type: "skills" | "languages" | "education",
    index: number
  ) => {
    if (!user) return;
    const updated = { ...user };
    if (type === "skills")
      updated.skills = user.skills?.filter((_, i) => i !== index);
    if (type === "languages")
      updated.languages = user.languages?.filter((_, i) => i !== index);
    if (type === "education")
      updated.education = user.education?.filter((_, i) => i !== index);
    setUser(updated);
  };

  const handleSave = async () => {
    if (!user?.email) return;
    
    setIsSaving(true);
    try {
      const payload = {
        email: user.email,
        fullname: user.fullname || "",
        skills: JSON.stringify(user.skills || []),
        languages: JSON.stringify(user.languages || []),
        degree: user.education?.[0]?.degree || "",
        institution: user.education?.[0]?.institution || "",
        degree_passout_year: user.education?.[0]?.degree_passout_year
          ? parseInt(user.education[0].degree_passout_year)
          : null,
        grade: user.education?.[0]?.grade || "",
        phone: "",
        department: "",
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(
          user.email
        )}/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      
      // Show success feedback
      const successMessage = document.createElement("div");
      successMessage.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
      successMessage.textContent = "Profile updated successfully!";
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
      
      setIsEditing(false);
      localStorage.setItem("userInfo", JSON.stringify(user));
    } catch (err) {
      console.error("Error updating profile:", err);
      
      // Show error feedback
      const errorMessage = document.createElement("div");
      errorMessage.className = "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
      errorMessage.textContent = "Error updating profile. Please try again.";
      document.body.appendChild(errorMessage);
      
      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return <p className="text-center text-gray-500 py-8">No user data found.</p>;

  return (
   <DashboardLayout role='employee'>
     <div className="max-w-4xl mx-auto space-y-8 p-6 text-black">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
         <Link
        href="/employee/profile"
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        ← Back
      </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Education & Skills</h1>
          <p className="text-gray-600 mt-1">Manage your professional qualifications and capabilities</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 border border-gray-300 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiEdit2 size={16} />
          {isEditing ? "Cancel Editing" : "Edit Profile"}
        </button>
      </div>

      {/* Education Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FiBook className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Education</h3>
            <p className="text-gray-600 text-sm">Your academic qualifications and background</p>
          </div>
        </div>

        <div className="space-y-4">
          {(user.education || []).map((edu, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{edu.degree}</h4>
                  <p className="text-gray-700 font-medium">{edu.institution}</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Graduated: {edu.degree_passout_year}</span>
                    {edu.grade && (
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        Grade: {edu.grade}
                      </span>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeItem("education", index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isEditing && (
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white">
              <h4 className="font-medium text-gray-900 mb-4">Add New Education</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bachelor of Science"
                    value={newEducation.degree}
                    onChange={(e) => handleEducationChange("degree", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., University Name"
                    value={newEducation.institution}
                    onChange={(e) => handleEducationChange("institution", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2020"
                    value={newEducation.degree_passout_year}
                    onChange={(e) => handleEducationChange("degree_passout_year", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 3.8 GPA"
                    value={newEducation.grade}
                    onChange={(e) => handleEducationChange("grade", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <button
                onClick={addEducation}
                disabled={!newEducation.degree || !newEducation.institution || !newEducation.degree_passout_year}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <FiPlus size={18} />
                Add Education
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <FiTrendingUp className="text-green-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Skills</h3>
            <p className="text-gray-600 text-sm">Your professional skills and expertise</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {(user.skills || []).map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"
            >
              {skill}
              {isEditing && (
                <button
                  onClick={() => removeItem("skills", index)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </span>
          ))}
          {(user.skills || []).length === 0 && !isEditing && (
            <p className="text-gray-500 italic">No skills added yet.</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Add a new skill (e.g., JavaScript, Project Management)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSkill()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
            <button
              onClick={addSkill}
              disabled={!newSkill}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus size={18} />
              Add
            </button>
          </div>
        )}
      </div>

      {/* Languages Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <FiGlobe className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Languages</h3>
            <p className="text-gray-600 text-sm">Languages you speak and write</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {(user.languages || []).map((language, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200"
            >
              {language}
              {isEditing && (
                <button
                  onClick={() => removeItem("languages", index)}
                  className="text-purple-600 hover:text-purple-800 transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </span>
          ))}
          {(user.languages || []).length === 0 && !isEditing && (
            <p className="text-gray-500 italic">No languages added yet.</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Add a language (e.g., English, Spanish)"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addLanguage()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
            <button
              onClick={addLanguage}
              disabled={!newLanguage}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus size={18} />
              Add
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave size={18} />
                Save All Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
   </DashboardLayout>
  );
};

export default EducationSkillsPage;