"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Briefcase,
  User,
  FileText,
  Award,
  Phone,
  Calendar,
  Download,
  Eye,
  X,
  Search,
  Building,
  Crown,
  Star,
  Trophy,
  Medal,
  Heart,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type ViewType = "employee" | "hr" | "manager";

type Employee = {
  email: string;
  fullname: string;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  profile_picture?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_no?: string | null;
  employment_type?: string | null;
};

type Award = {
  id: number;
  email: string;
  title: string;
  description?: string | null;
  photo?: string | null;
  created_at: string;
};

type DocumentData = {
  email_id: string;
  [key: string]: string | null;
};

export default function TeamReport() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrs, setHrs] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [view, setView] = useState<ViewType>("employee");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [docs, setDocs] = useState<DocumentData | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");

  const [awards, setAwards] = useState<Award[]>([]);

  // 🔹 Fetch employees, HRs, and managers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, hrRes, managerRes] = await Promise.all([
          fetch(`${API_BASE}/api/accounts/employees/`),
          fetch(`${API_BASE}/api/accounts/hrs/`),
          fetch(`${API_BASE}/api/accounts/managers/`),
        ]);

        setEmployees(await empRes.json());
        setHrs(await hrRes.json());
        setManagers(await managerRes.json());
      } catch (err) {
        console.error("Error fetching team data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔹 Get current list with search filter
  const list = (
    view === "employee" ? employees : view === "hr" ? hrs : managers
  ).filter(
    (emp) =>
      emp.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔹 Fetch documents for selected employee
  const fetchDocuments = async (email: string) => {
    setDocLoading(true);
    setDocError("");
    setDocs(null);
    setSelectedDoc(null);

    try {
      const res = await fetch(`${API_BASE}/api/accounts/get_document/${email}/`);
      if (!res.ok) throw new Error("No documents found");

      const data = await res.json();
      const record: DocumentData = Array.isArray(data) ? data[0] : data;
      if (!record || Object.keys(record).length === 0)
        throw new Error("No records found");

      setDocs(record);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDocError(err.message);
      } else {
        setDocError("Something went wrong");
      }
    } finally {
      setDocLoading(false);
    }
  };

  // 🔹 Fetch awards for the selected employee
  const fetchAwards = async (email: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/accounts/list_awards/`);
      if (res.data && Array.isArray(res.data)) {
        const userAwards = res.data.filter(
          (award: Award) => award.email === email
        );
        setAwards(userAwards);
      } else {
        setAwards([]);
      }
    } catch (err) {
      console.error("Error fetching awards:", err);
      setAwards([]);
    }
  };

  // 🔹 When employee is selected, fetch docs + awards
  useEffect(() => {
    if (selectedEmp?.email) {
      fetchDocuments(selectedEmp.email);
      fetchAwards(selectedEmp.email);
    }
  }, [selectedEmp]);

  // 🔹 Handle file type render
  const renderDocumentViewer = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase();
    if (!ext) return <p>Invalid file format</p>;

    if (ext === "pdf") {
      return (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(
            url
          )}&embedded=true`}
          className="w-full h-[600px] rounded-lg border shadow-sm"
        />
      );
    } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return (
        <div className="flex justify-center">
          <Image
            src={url}
            alt="Document"
            width={800}
            height={500}
            className="max-w-full h-auto rounded-lg shadow-sm border"
          />
        </div>
      );
    } else if (["mp4", "webm"].includes(ext)) {
      return (
        <video
          src={url}
          controls
          className="w-full max-w-2xl h-auto rounded-lg shadow-sm border mx-auto"
        />
      );
    } else {
      return (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Unsupported file type: <b>{ext}</b>
          </p>
          <a
            href={url}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-3"
          >
            <Download className="w-4 h-4" />
            Download File
          </a>
        </div>
      );
    }
  };

  // 🔹 Avatar fallback
  const getAvatar = (emp: Employee) =>
    emp.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.fullname || emp.email
    )}&background=0D8ABC&color=fff&bold=true`;

  // 🔹 Get role icon and color
  const getRoleConfig = (role: string) => {
    switch (role) {
      case "manager":
        return { icon: <Crown className="w-4 h-4" />, color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "hr":
        return { icon: <User className="w-4 h-4" />, color: "bg-blue-100 text-blue-800 border-blue-200" };
      default:
        return { icon: <Users className="w-4 h-4" />, color: "bg-green-100 text-green-800 border-green-200" };
    }
  };

  // 🔹 Get award icon based on title
  const getAwardIcon = (title: string) => {
    if (title.toLowerCase().includes("star")) return <Star className="w-5 h-5" />;
    if (title.toLowerCase().includes("trophy")) return <Trophy className="w-5 h-5" />;
    if (title.toLowerCase().includes("medal")) return <Medal className="w-5 h-5" />;
    return <Award className="w-5 h-5" />;
  };

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Team Dashboard
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Manage and view your team members, their documents, and achievements in one place
              </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Employees</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{employees.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">HR Team</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{hrs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Managers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{managers.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="flex-1 w-full lg:max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, email, department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                  {[
                    { label: "Employees", value: "employee", icon: <Users className="w-4 h-4" /> },
                    { label: "HR Team", value: "hr", icon: <User className="w-4 h-4" /> },
                    { label: "Managers", value: "manager", icon: <Crown className="w-4 h-4" /> },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setView(tab.value as ViewType)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === tab.value
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      {tab.icon}
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Team Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading team data...</p>
              </div>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No {view} found</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {searchTerm ? "Try adjusting your search terms" : `No ${view} records available`}
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {list.map((emp, index) => (
                <motion.div
                  key={emp.email}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelectedEmp(emp)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Image
                          src={getAvatar(emp)}
                          alt="Profile"
                          width={60}
                          height={60}
                          className="rounded-2xl border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                          {getRoleConfig(view).icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {emp.fullname}
                        </h3>
                        <p className="text-sm text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {emp.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{emp.department}</span>
                      </div>
                    )}
                    {emp.designation && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{emp.designation}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleConfig(view).color}`}>
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </span>
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Employee Detail Modal */}
        <AnimatePresence>
          {selectedEmp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Image
                        src={getAvatar(selectedEmp)}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="rounded-2xl border-4 border-white/20"
                      />
                      <div>
                        <h2 className="text-2xl font-bold">{selectedEmp.fullname}</h2>
                        <p className="text-blue-100">{selectedEmp.email}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {selectedEmp.department && (
                            <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-sm">
                              <Building className="w-3 h-3" />
                              {selectedEmp.department}
                            </span>
                          )}
                          {selectedEmp.designation && (
                            <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-sm">
                              <Briefcase className="w-3 h-3" />
                              {selectedEmp.designation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEmp(null)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Personal Information & Emergency Contact */}
                    <div className="lg:col-span-1 space-y-6">
                      {/* Personal Information */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <UserCircle className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-700">Department:</span>
                            <span className="text-gray-900">{selectedEmp.department || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-700">Designation:</span>
                            <span className="text-gray-900">{selectedEmp.designation || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="text-gray-900">{selectedEmp.phone || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-700">Employment Type:</span>
                            <span className="text-gray-900">{selectedEmp.employment_type || "Not provided"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <Heart className="w-5 h-5 text-red-500" />
                          <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-700">Name:</span>
                            <span className="text-gray-900">{selectedEmp.emergency_contact_name || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-700">Relationship:</span>
                            <span className="text-gray-900">{selectedEmp.emergency_contact_relationship || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="text-gray-900">{selectedEmp.emergency_contact_no || "Not provided"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Documents & Awards */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Documents Section */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Documents
                          </h3>
                          {docs && (
                            <span className="text-sm text-gray-500">
                              {Object.keys(docs).filter(key => key !== "email_id" && docs[key]).length} files
                            </span>
                          )}
                        </div>

                        {docLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-gray-600">Loading documents...</p>
                          </div>
                        ) : docError ? (
                          <div className="text-center py-8 bg-red-50 rounded-xl border border-red-200">
                            <FileText className="w-12 h-12 text-red-400 mx-auto mb-3" />
                            <p className="text-red-600 font-medium">{docError}</p>
                          </div>
                        ) : docs && !selectedDoc ? (
                          <div className="grid gap-3">
                            {Object.entries(docs)
                              .filter(
                                ([key, value]) =>
                                  key !== "email_id" &&
                                  value &&
                                  typeof value === "string" &&
                                  value.startsWith("https")
                              )
                              .map(([key, value]) => (
                                <motion.div
                                  key={key}
                                  whileHover={{ scale: 1.02 }}
                                  className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <span className="capitalize text-gray-700 font-medium">
                                      {key.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setSelectedDoc(value as string)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </button>
                                </motion.div>
                              ))}
                          </div>
                        ) : selectedDoc ? (
                          <div className="space-y-4">
                            <button
                              onClick={() => setSelectedDoc(null)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                            >
                              <X className="w-4 h-4" />
                              Back to Documents
                            </button>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              {renderDocumentViewer(selectedDoc)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No documents available</p>
                            <p className="text-gray-500 text-sm mt-1">This employee hasn&apos;t uploaded any documents yet</p>
                          </div>
                        )}
                      </div>

                      {/* Awards Section */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                            Awards & Achievements
                          </h3>
                          <span className="text-sm text-gray-500">{awards.length} awards</span>
                        </div>

                        {awards.length > 0 ? (
                          <div className="grid gap-4">
                            {awards.map((award) => (
                              <motion.div
                                key={award.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                      {getAwardIcon(award.title)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-900">{award.title}</h4>
                                      {award.description && (
                                        <p className="text-sm text-gray-600 mt-1">{award.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(award.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  {award.photo && (
                                    <button
                                      onClick={() => setSelectedDoc(award.photo!)}
                                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Photo
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No awards yet</p>
                            <p className="text-gray-500 text-sm mt-1">This employee hasn&apos;t received any awards</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}