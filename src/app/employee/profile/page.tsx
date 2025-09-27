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
  FiMapPin,
  FiCalendar,
  FiHeart,
  FiGlobe,
  FiFileText,
  FiAward,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiHome,
  FiUsers,
  FiBook,
  FiGitBranch,
  FiTrash2
} from "react-icons/fi";

// Types
type UserProfile = {
  name: string;
  email: string;
  picture?: string;
  role: string;
  phone?: string;
  department?: string;
  currentAddress?: string;
  permanentAddress?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  employmentDetails?: {
    employeeId: string;
    dateOfJoining: string;
    workLocation: string;
    employmentType: string;
    designation: string;
    salary?: string;
    reportingManager?: string;
    team?: string;
  };
  education?: {
    degree: string;
    institution: string;
    year: string;
    grade?: string;
  }[];
  skills?: string[];
  languages?: string[];
  documents?: {
    [key: string]: string;
  };
};

type FetchUserResponse = {
  fullname?: string;
  email: string;
  profile_picture?: string;
  role: string;
  phone?: string;
  department?: string;
  currentAddress?: string;
  permanentAddress?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  employmentDetails?: {
    employeeId: string;
    dateOfJoining: string;
    workLocation: string;
    employmentType: string;
    designation: string;
    salary?: string;
    reportingManager?: string;
    team?: string;
  };
  education?: {
    degree: string;
    institution: string;
    year: string;
    grade?: string;
  }[];
  skills?: string[];
  languages?: string[];
};

type DocumentType = "tenth" | "twelfth" | "degree" | "awards" | "resume" | "idProof" | "addressProof";

type Document = {
  id?: number;
  type: DocumentType;
  file_url: string;
  employee_id: number;
};

export default function Profile() {
  const [user, setUser] = useState<UserProfile>({
    name: "",
    email: "",
    picture: "",
    role: "",
    phone: "",
    department: "",
    currentAddress: "",
    permanentAddress: "",
    dob: "",
    gender: "",
    nationality: "",
    maritalStatus: "",
    emergencyContact: { name: "", relationship: "", phone: "" },
    employmentDetails: {
      employeeId: "",
      dateOfJoining: "",
      workLocation: "",
      employmentType: "",
      designation: "",
      salary: "",
      reportingManager: "",
      team: ""
    },
    education: [],
    skills: [],
    languages: [],
    documents: {},
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const [docPreview, setDocPreview] = useState<{ type: DocumentType; url: string } | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newEducation, setNewEducation] = useState({ degree: "", institution: "", year: "", grade: "" });
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async (email: string) => {
      try {
        const response = await fetch(
          `${API_URL}/api/accounts/employees/${encodeURIComponent(email)}/`,
          { headers: { "Content-Type": "application/json" } }
        );
        if (!response.ok) throw new Error("Failed to fetch user data");
        const currentUser: FetchUserResponse = await response.json();
        
        setUser({
          name: currentUser.fullname || "",
          email: currentUser.email || email,
          picture: currentUser.profile_picture || "/default-profile.png",
          role: currentUser.role || "",
          phone: currentUser.phone || "",
          department: currentUser.department || "",
          currentAddress: currentUser.currentAddress || "",
          permanentAddress: currentUser.permanentAddress || "",
          dob: currentUser.dob || "",
          gender: currentUser.gender || "",
          nationality: currentUser.nationality || "",
          maritalStatus: currentUser.maritalStatus || "",
          emergencyContact: currentUser.emergencyContact || { name: "", relationship: "", phone: "" },
          employmentDetails: currentUser.employmentDetails || {
            employeeId: "",
            dateOfJoining: "",
            workLocation: "",
            employmentType: "",
            designation: "",
            salary: "",
            reportingManager: "",
            team: ""
          },
          education: currentUser.education || [],
          skills: currentUser.skills || [],
          languages: currentUser.languages || [],
          documents: {},
        });

        // Extract employee ID from the response URL or data
        if (response.url) {
          const idMatch = response.url.match(/employees\/(\d+)/);
          if (idMatch) setEmployeeId(parseInt(idMatch[1]));
        }

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

  // Fetch documents when employeeId is available
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!employeeId) return;
      
      try {
        const res = await fetch(`${API_URL}/api/list_documents/?employee_id=${employeeId}`);
        if (!res.ok) throw new Error("Failed to fetch documents");
        const docs: Document[] = await res.json();
        
        const docMap: { [key: string]: string } = {};
        docs.forEach((doc) => {
          docMap[doc.type] = doc.file_url;
        });
        
        setUser(prev => ({ ...prev, documents: docMap }));
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };

    fetchDocuments();
  }, [employeeId]);

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      setUser((prev) => ({ ...prev, picture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // Document upload handler
  const handleDocumentUpload = async (type: DocumentType, file: File) => {
    if (!employeeId) {
      alert("Employee ID not found");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size cannot exceed 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("employee_id", employeeId.toString());
    formData.append("title", `${type} Document`);
    formData.append("file_url", file);
    formData.append("status", "Submitted");
    formData.append("type", type);

    try {
      // Check if document already exists
      const existingDocsRes = await fetch(`${API_URL}/api/list_documents/?employee_id=${employeeId}&type=${type}`);
      let existingDocId: number | null = null;
      
      if (existingDocsRes.ok) {
        const existingDocs: Document[] = await existingDocsRes.json();
        if (existingDocs.length > 0) {
          existingDocId = existingDocs[0].id!;
        }
      }

      const url = existingDocId 
        ? `${API_URL}/api/update_document/${existingDocId}/`
        : `${API_URL}/api/create_document/`;

      const method = existingDocId ? "PUT" : "POST";

      const res = await fetch(url, { 
        method, 
        body: formData 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to upload document: ${errorText}`);
      }

      const data = await res.json();
      
      // Update local state
      setUser(prev => ({
        ...prev,
        documents: { ...prev.documents, [type]: data.file_url }
      }));
      
      setSaveMessage({ type: "success", text: `${type} document uploaded successfully!` });
    } catch (err) {
      console.error("Document upload error:", err);
      setSaveMessage({ type: "error", text: "Document upload failed!" });
    }
  };

  // Document delete handler
  const handleDocumentDelete = async (type: DocumentType) => {
    if (!employeeId) return;

    try {
      // Get document ID first
      const docsRes = await fetch(`${API_URL}/api/list_documents/?employee_id=${employeeId}&type=${type}`);
      if (!docsRes.ok) throw new Error("Failed to fetch documents");
      
      const docs: Document[] = await docsRes.json();
      if (docs.length === 0) return;

      const docId = docs[0].id;
      if (!docId) return;

      const res = await fetch(`${API_URL}/api/delete_document/${docId}/`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete document");

      setUser(prev => {
        const updatedDocs = { ...prev.documents };
        delete updatedDocs[type];
        return { ...prev, documents: updatedDocs };
      });

      setSaveMessage({ type: "success", text: `${type} document deleted successfully!` });
    } catch (err) {
      console.error("Document delete error:", err);
      setSaveMessage({ type: "error", text: "Delete failed!" });
    }
  };

  // Add new skill
  const addSkill = () => {
    if (newSkill && !user.skills?.includes(newSkill)) {
      setUser(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill]
      }));
      setNewSkill("");
    }
  };

  // Add new language
  const addLanguage = () => {
    if (newLanguage && !user.languages?.includes(newLanguage)) {
      setUser(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage]
      }));
      setNewLanguage("");
    }
  };

  // Add education
  const addEducation = () => {
    if (newEducation.degree && newEducation.institution && newEducation.year) {
      setUser(prev => ({
        ...prev,
        education: [...(prev.education || []), { ...newEducation }]
      }));
      setNewEducation({ degree: "", institution: "", year: "", grade: "" });
    }
  };

  // Remove skill/language/education
  const removeItem = (type: "skills" | "languages" | "education", index: number) => {
    if (type === "education") {
      setUser(prev => ({
        ...prev,
        education: prev.education?.filter((_, i) => i !== index) || []
      }));
    } else {
      setUser(prev => ({
        ...prev,
        [type]: prev[type]?.filter((_, i) => i !== index) || []
      }));
    }
  };

  // Save profile
 // Replace the handleSave function with this corrected version:

const handleSave = async () => {
  if (user.phone && !/^[\+]?[0-9]{6,15}$/.test(user.phone.replace(/\s/g, ""))) {
    setSaveMessage({ type: "error", text: "Please enter a valid phone number" });
    return;
  }

  setIsSaving(true);
  try {
    const fileInput = fileInputRef.current?.files?.[0];
    const formData = new FormData();
    
    // Append all required fields individually
    formData.append("email", user.email);
    formData.append("fullname", user.name);
    formData.append("phone", user.phone || "");
    formData.append("department", user.department || "");
    formData.append("currentAddress", user.currentAddress || "");
    formData.append("permanentAddress", user.permanentAddress || "");
    formData.append("dob", user.dob || "");
    formData.append("gender", user.gender || "");
    formData.append("nationality", user.nationality || "");
    formData.append("maritalStatus", user.maritalStatus || "");
    
    // Append nested objects as JSON strings
    if (user.emergencyContact) {
      formData.append("emergencyContact", JSON.stringify(user.emergencyContact));
    }
    
    if (user.employmentDetails) {
      formData.append("employmentDetails", JSON.stringify(user.employmentDetails));
    }
    
    if (user.education && user.education.length > 0) {
      formData.append("education", JSON.stringify(user.education));
    }
    
    if (user.skills && user.skills.length > 0) {
      formData.append("skills", JSON.stringify(user.skills));
    }
    
    if (user.languages && user.languages.length > 0) {
      formData.append("languages", JSON.stringify(user.languages));
    }

    if (fileInput) formData.append("profile_picture", fileInput);

    const response = await fetch(
      `${API_URL}/api/accounts/employees/${encodeURIComponent(user.email)}/`,
      { 
        method: "PUT", 
        body: formData 
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update profile: ${errorText}`);
    }
    
    const updatedUser: FetchUserResponse = await response.json();
    setUser(prev => ({
      ...prev,
      ...updatedUser,
      name: updatedUser.fullname || prev.name,
      picture: updatedUser.profile_picture || prev.picture
    }));

    // Update localStorage with the correct structure
    const userInfoForStorage = {
      email: updatedUser.email,
      fullname: updatedUser.fullname,
      profile_picture: updatedUser.profile_picture,
      ...updatedUser
    };
    
    localStorage.setItem("userInfo", JSON.stringify(userInfoForStorage));
    setSaveMessage({ type: "success", text: "Profile updated successfully!" });
    setIsEditing(false);
  } catch (error: unknown) {
    console.error("Save error:", error);
    const message = error instanceof Error ? error.message : "Failed to save profile changes.";
    setSaveMessage({ type: "error", text: message });
  } finally {
    setIsSaving(false);
    setTimeout(() => setSaveMessage({ type: "", text: "" }), 5000);
  }
};

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage({ type: "", text: "" });
    // Reload original data
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(prev => ({ ...prev, ...parsed }));
    }
  };

  // Tab content components
  const PersonalInfoTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiUser size={16} /> Full Name
          </label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiMail size={16} /> Email Address
          </label>
          <input type="email" value={user.email} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiPhone size={16} /> Phone Number
          </label>
          <input
            type="tel"
            value={user.phone || ""}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiCalendar size={16} /> Date of Birth
          </label>
          <input
            type="date"
            value={user.dob || ""}
            onChange={(e) => setUser({ ...user, dob: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={user.gender || ""}
            onChange={(e) => setUser({ ...user, gender: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
          <select
            value={user.maritalStatus || ""}
            onChange={(e) => setUser({ ...user, maritalStatus: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          >
            <option value="">Select Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiGlobe size={16} /> Nationality
          </label>
          <input
            type="text"
            value={user.nationality || ""}
            onChange={(e) => setUser({ ...user, nationality: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiMapPin size={16} /> Current Address
          </label>
          <textarea
            value={user.currentAddress || ""}
            onChange={(e) => setUser({ ...user, currentAddress: e.target.value })}
            disabled={!isEditing}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiHome size={16} /> Permanent Address
          </label>
          <textarea
            value={user.permanentAddress || ""}
            onChange={(e) => setUser({ ...user, permanentAddress: e.target.value })}
            disabled={!isEditing}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );

  const EmploymentInfoTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
          <input type="text" value={user.employmentDetails?.employeeId || ""} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Joining</label>
          <input type="date" value={user.employmentDetails?.dateOfJoining || ""} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select
            value={user.department || ""}
            onChange={(e) => setUser({ ...user, department: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          >
            <option value="">Select Department</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="HR">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="IT">Information Technology</option>
            <option value="R&D">Research & Development</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
          <input
            type="text"
            value={user.employmentDetails?.designation || ""}
            onChange={(e) => setUser({ 
              ...user, 
              employmentDetails: { ...user.employmentDetails!, designation: e.target.value }
            })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
          <select
            value={user.employmentDetails?.employmentType || ""}
            onChange={(e) => setUser({ 
              ...user, 
              employmentDetails: { ...user.employmentDetails!, employmentType: e.target.value }
            })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          >
            <option value="">Select Type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Location</label>
          <input
            type="text"
            value={user.employmentDetails?.workLocation || ""}
            onChange={(e) => setUser({ 
              ...user, 
              employmentDetails: { ...user.employmentDetails!, workLocation: e.target.value }
            })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Manager</label>
          <input
            type="text"
            value={user.employmentDetails?.reportingManager || ""}
            onChange={(e) => setUser({ 
              ...user, 
              employmentDetails: { ...user.employmentDetails!, reportingManager: e.target.value }
            })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
          <input
            type="text"
            value={user.employmentDetails?.team || ""}
            onChange={(e) => setUser({ 
              ...user, 
              employmentDetails: { ...user.employmentDetails!, team: e.target.value }
            })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );

  const EmergencyContactTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
          <input
            type="text"
            value={user.emergencyContact?.name || ""}
            onChange={(e) => setUser({ 
              ...user, 
              emergencyContact: { ...user.emergencyContact!, name: e.target.value }
            })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
          <select
            value={user.emergencyContact?.relationship || ""}
            onChange={(e) => setUser({ 
              ...user, 
              emergencyContact: { ...user.emergencyContact!, relationship: e.target.value }
            })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          >
            <option value="">Select Relationship</option>
            <option value="Spouse">Spouse</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
            <option value="Friend">Friend</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
          <input
            type="tel"
            value={user.emergencyContact?.phone || ""}
            onChange={(e) => setUser({ 
              ...user, 
              emergencyContact: { ...user.emergencyContact!, phone: e.target.value }
            })}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );

  const EducationSkillsTab = () => (
    <div className="space-y-8">
      {/* Education Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiBook size={20} /> Education
        </h3>
        <div className="space-y-4">
          {user.education?.map((edu, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{edu.degree}</h4>
                  <p className="text-sm text-gray-600">{edu.institution} • {edu.year}</p>
                  {edu.grade && <p className="text-sm text-gray-600">Grade: {edu.grade}</p>}
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeItem("education", index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isEditing && (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  placeholder="Degree"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={newEducation.institution}
                  onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={newEducation.year}
                  onChange={(e) => setNewEducation({...newEducation, year: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Grade (Optional)"
                  value={newEducation.grade}
                  onChange={(e) => setNewEducation({...newEducation, grade: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={addEducation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Add Education
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiTrendingUp size={20} /> Skills
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {user.skills?.map((skill, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {skill}
              {isEditing && (
                <button
                  onClick={() => removeItem("skills", index)}
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Languages Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiGlobe size={20} /> Languages
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {user.languages?.map((language, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {language}
              {isEditing && (
                <button
                  onClick={() => removeItem("languages", index)}
                  className="text-green-600 hover:text-green-800 ml-1"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a language"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
            />
            <button
              onClick={addLanguage}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const DocumentsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {([
          { key: "tenth" as DocumentType, label: "10th Marksheet", icon: FiFileText },
          { key: "twelfth" as DocumentType, label: "12th Marksheet", icon: FiFileText },
          { key: "degree" as DocumentType, label: "Degree Certificate", icon: FiBook },
          { key: "awards" as DocumentType, label: "Awards & Certifications", icon: FiAward },
          { key: "resume" as DocumentType, label: "Resume", icon: FiFileText },
          { key: "idProof" as DocumentType, label: "ID Proof", icon: FiUser },
          { key: "addressProof" as DocumentType, label: "Address Proof", icon: FiHome },
        ]).map(({ key, label, icon: Icon }) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-gray-600" />
                <span className="font-medium">{label}</span>
              </div>
              {user.documents?.[key] && (
                <span className="text-green-600 text-sm">✓ Uploaded</span>
              )}
            </div>
            
            <div className="flex gap-2">
              {user.documents?.[key] && (
                <>
                  <button
                    onClick={() => setDocPreview({ type: key, url: user.documents![key]! })}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    View
                  </button>
                  {isEditing && (
                    <button
                      onClick={() => handleDocumentDelete(key)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  )}
                </>
              )}
              {isEditing && (
                <label className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm text-center cursor-pointer hover:bg-blue-700">
                  Upload
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleDocumentUpload(key, e.target.files[0])}
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout role="employee">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={user.picture || "/default-profile.png"}
                alt={user.name || "Profile"}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                unoptimized={!!(user.picture && user.picture.startsWith("http"))}
              />
              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    type="button"
                  >
                    <FiCamera size={16} />
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.employmentDetails?.designation || user.role}</p>
              <p className="text-sm text-gray-500">{user.department} • {user.employmentDetails?.employeeId}</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <FiEdit size={18} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors font-medium"
              >
                {isSaving ? "Saving..." : (<><FiSave size={18} /> Save Changes</>)}
              </button>
            </div>
          )}
        </div>

        {/* Status Message */}
        {saveMessage.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              saveMessage.type === "success" 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: "personal", label: "Personal Info", icon: FiUser },
              { id: "employment", label: "Employment", icon: FiBriefcase },
              { id: "emergency", label: "Emergency Contact", icon: FiUsers },
              { id: "education", label: "Education & Skills", icon: FiBook },
              { id: "documents", label: "Documents", icon: FiFileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "personal" && <PersonalInfoTab />}
          {activeTab === "employment" && <EmploymentInfoTab />}
          {activeTab === "emergency" && <EmergencyContactTab />}
          {activeTab === "education" && <EducationSkillsTab />}
          {activeTab === "documents" && <DocumentsTab />}
        </div>

        {/* Document Preview Modal */}
        {docPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold capitalize">
                  {docPreview.type.replace(/([A-Z])/g, ' $1')} Document
                </h3>
                <button
                  onClick={() => setDocPreview(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4 h-[calc(90vh-80px)]">
                {docPreview.url.endsWith(".pdf") ? (
                  <iframe src={docPreview.url} className="w-full h-full border-0" />
                ) : (
                  <img 
                    src={docPreview.url} 
                    alt={docPreview.type} 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}