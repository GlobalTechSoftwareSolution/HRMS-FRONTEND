"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FiBook, FiTrendingUp, FiGlobe, FiPlus, FiX, FiSave, FiEdit3 } from "react-icons/fi";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

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
  const [isEditing, setIsEditing] = useState(false);
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

  // Enhanced user data fetching with error handling
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedUser = localStorage.getItem("userInfo");
      if (!storedUser) {
        toast.error("No user data found. Please log in again.");
        return;
      }

      const parsed = JSON.parse(storedUser) as { email?: string };
      if (!parsed.email) {
        toast.error("Invalid user data. Please log in again.");
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(
          parsed.email
        )}/`
      );

      const fetchedUser: User = {
        email: response.data.email,
        fullname: response.data.fullname,
        skills: response.data.skills ? JSON.parse(response.data.skills) : [],
        languages: response.data.languages ? JSON.parse(response.data.languages) : [],
        education: response.data.degree
          ? [
              {
                degree: response.data.degree,
                institution: response.data.institution,
                degree_passout_year: response.data.degree_passout_year
                  ? response.data.degree_passout_year.toString()
                  : "",
                grade: response.data.grade || "",
              },
            ]
          : [],
      };
      
      setUser(fetchedUser);
      toast.success("Profile loaded successfully!");
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load profile data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleEducationChange = (field: keyof Education, value: string) => {
    setNewEducation((prev) => ({ ...prev, [field]: value }));
  };

  const validateEducation = (education: Education): boolean => {
    if (!education.degree.trim()) {
      toast.error("Degree field is required");
      return false;
    }
    if (!education.institution.trim()) {
      toast.error("Institution field is required");
      return false;
    }
    if (!education.degree_passout_year.trim()) {
      toast.error("Year field is required");
      return false;
    }
    const year = parseInt(education.degree_passout_year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 5) {
      toast.error("Please enter a valid year");
      return false;
    }
    return true;
  };

  const addEducation = () => {
    if (!validateEducation(newEducation)) return;

    setUser((prev) =>
      prev
        ? { 
            ...prev, 
            education: [...(prev.education || []), { ...newEducation }] 
          }
        : prev
    );
    setNewEducation({ 
      degree: "", 
      institution: "", 
      degree_passout_year: "", 
      grade: "" 
    });
    toast.success("Education added successfully!");
  };

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (!trimmedSkill) {
      toast.error("Please enter a skill");
      return;
    }

    if (user?.skills?.includes(trimmedSkill)) {
      toast.warning("Skill already exists");
      return;
    }

    setUser((prev) =>
      prev ? { ...prev, skills: [...(prev.skills || []), trimmedSkill] } : prev
    );
    setNewSkill("");
    toast.success("Skill added successfully!");
  };

  const addLanguage = () => {
    const trimmedLanguage = newLanguage.trim();
    if (!trimmedLanguage) {
      toast.error("Please enter a language");
      return;
    }

    if (user?.languages?.includes(trimmedLanguage)) {
      toast.warning("Language already exists");
      return;
    }

    setUser((prev) =>
      prev
        ? { ...prev, languages: [...(prev.languages || []), trimmedLanguage] }
        : prev
    );
    setNewLanguage("");
    toast.success("Language added successfully!");
  };

  const removeItem = (
    type: "skills" | "languages" | "education",
    index: number
  ) => {
    if (!user) return;
    
    const updated = { ...user };
    if (type === "skills") {
      updated.skills = user.skills?.filter((_, i) => i !== index);
      toast.info("Skill removed");
    }
    if (type === "languages") {
      updated.languages = user.languages?.filter((_, i) => i !== index);
      toast.info("Language removed");
    }
    if (type === "education") {
      updated.education = user.education?.filter((_, i) => i !== index);
      toast.info("Education entry removed");
    }
    setUser(updated);
  };

  const handleSave = async () => {
    if (!user?.email) {
      toast.error("No user email found");
      return;
    }

    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!user.fullname?.trim()) {
        toast.error("Full name is required");
        return;
      }

      const payload = {
        email: user.email,
        fullname: user.fullname.trim(),
        skills: JSON.stringify(user.skills || []),
        languages: JSON.stringify(user.languages || []),
        degree: user.education?.[0]?.degree || "",
        institution: user.education?.[0]?.institution || "",
        degree_passout_year: user.education?.[0]?.degree_passout_year
          ? parseInt(user.education[0].degree_passout_year)
          : null,
        grade: user.education?.[0]?.grade || "",
        phone: "", // Add actual phone data if available
        department: "", // Add actual department data if available
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(
          user.email
        )}/`,
        payload,
        { 
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}` // Add auth header if needed
          } 
        }
      );
      
      localStorage.setItem("userInfo", JSON.stringify(user));
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const errorMessage = error.response?.data?.message || "Error updating profile";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      action();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Failed to load user data</p>
        <button
          onClick={fetchUserData}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
   <DashboardLayout role='employee'>
     <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
         <Link
      href="/employee/profile"
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    >
      ← Back
    </Link>
        <h2 className="text-2xl font-bold text-gray-800">Education & Skills</h2>
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiEdit3 size={16} />
              Edit Education
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Education Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-800">
          <FiBook className="text-purple-600" size={24} /> 
          Education
        </h3>
        
        <div className="space-y-4">
          {(user.education || []).map((edu, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{edu.degree}</h4>
                  <p className="text-gray-600 mt-1">
                    {edu.institution} • {edu.degree_passout_year}
                  </p>
                  {edu.grade && (
                    <p className="text-gray-500 mt-1">Grade: {edu.grade}</p>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeItem("education", index)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                    title="Remove education"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isEditing && (
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-4">Add New Education</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bachelor of Science in Computer Science"
                    value={newEducation.degree}
                    onChange={(e) => handleEducationChange("degree", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., University of Technology"
                    value={newEducation.institution}
                    onChange={(e) => handleEducationChange("institution", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Graduation Year *
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    placeholder="e.g., 2023"
                    value={newEducation.degree_passout_year}
                    onChange={(e) => handleEducationChange("degree_passout_year", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 3.8 GPA, First Class"
                    value={newEducation.grade}
                    onChange={(e) => handleEducationChange("grade", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={addEducation}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiPlus size={16} />
                Add Education
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Skills Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-800">
          <FiTrendingUp className="text-blue-600" size={24} /> 
          Skills
        </h3>
        
        <div className="flex flex-wrap gap-3 mb-6">
          {(user.skills || []).map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
            >
              {skill}
              {isEditing && (
                <button
                  onClick={() => removeItem("skills", index)}
                  className="text-blue-600 hover:text-blue-800 transition-colors rounded-full hover:bg-blue-100 p-1"
                  title="Remove skill"
                >
                  <FiX size={14} />
                </button>
              )}
            </span>
          ))}
          {(user.skills?.length === 0) && (
            <p className="text-gray-500 italic">No skills added yet</p>
          )}
        </div>
        
        {isEditing && (
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Add a new skill (e.g., React, Python, Project Management)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addSkill)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <button
              onClick={addSkill}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiPlus size={16} />
              Add
            </button>
          </div>
        )}
      </section>

      {/* Languages Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-800">
          <FiGlobe className="text-green-600" size={24} /> 
          Languages
        </h3>
        
        <div className="flex flex-wrap gap-3 mb-6">
          {(user.languages || []).map((language, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"
            >
              {language}
              {isEditing && (
                <button
                  onClick={() => removeItem("languages", index)}
                  className="text-green-600 hover:text-green-800 transition-colors rounded-full hover:bg-green-100 p-1"
                  title="Remove language"
                >
                  <FiX size={14} />
                </button>
              )}
            </span>
          ))}
          {(user.languages?.length === 0) && (
            <p className="text-gray-500 italic">No languages added yet</p>
          )}
        </div>
        
        {isEditing && (
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Add a language (e.g., English, Spanish, French)"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addLanguage)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
            <button
              onClick={addLanguage}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FiPlus size={16} />
              Add
            </button>
          </div>
        )}
      </section>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <FiSave size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
   </DashboardLayout>
  );
};

export default EducationSkillsPage;