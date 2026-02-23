"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Plus,
  Eye,
  CheckCircle,
  Users,
  Briefcase,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  User,
  GraduationCap,
  FileText,
  MapPin,
  IndianRupee,
  BookOpen,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface Career {
  id?: number;
  title: string;
  department: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  location: string;
  type: string;
  experience: string;
  salary: string;
  education: string;
}

interface AppliedJob {
  email: string;
  fullname: string;
  gender: string;
  phone_number: string;
  course: string;
  resume: string | null;
  available_for_training: string;
  work_experience: string;
  specialization: string;
  hired: boolean;
  created_at?: string;
  report?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemName
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  itemName: string;
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 bg-white gap-4 rounded-b-2xl">
      <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
        Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-bold text-slate-900">{totalItems}</span> {itemName}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center h-9 px-3 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        >
          <ChevronLeft className="w-4 h-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, idx) => (
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="w-8 h-9 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 text-sm font-medium">...</span>
            ) : (
              <button
                key={`page-${page}`}
                onClick={() => onPageChange(page as number)}
                className={`inline-flex flex-shrink-0 items-center justify-center w-8 h-9 sm:w-9 sm:h-9 rounded-xl text-sm font-bold transition-all ${currentPage === page
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200'
                  }`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center justify-center h-9 px-3 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 sm:ml-1.5" />
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [showCareerDetail, setShowCareerDetail] = useState<Career | null>(null);
  const [showAppliedDetail, setShowAppliedDetail] = useState<AppliedJob | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Pagination states
  const [currentPageCareers, setCurrentPageCareers] = useState(1);
  const [currentPageApplied, setCurrentPageApplied] = useState(1);
  const itemsPerPage = 5;

  const [newCareer, setNewCareer] = useState<Career>({
    title: "",
    department: "",
    description: "",
    responsibilities: [],
    requirements: [],
    benefits: [],
    skills: [],
    location: "",
    type: "",
    experience: "",
    salary: "",
    education: "",
  });

  // ===== CHECK MOBILE DEVICE =====
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== FETCH DATA =====
  const fetchCareers = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/careers/`
      );
      console.log("Careers API response:", res.data); // Debug logging
      const careersData = Array.isArray(res.data) ? res.data : (res.data?.careers || res.data?.data || []);
      console.log("Extracted careers data:", careersData); // Debug logging
      // Transform string data to arrays
      const transformedCareers = careersData.map(
        (career: Record<string, unknown> & Partial<Career>) => ({
          ...career,
          responsibilities: Array.isArray(career.responsibilities)
            ? career.responsibilities
            : typeof career.responsibilities === "string"
              ? (career.responsibilities as string)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
              : [],
          requirements: Array.isArray(career.requirements)
            ? career.requirements
            : typeof career.requirements === "string"
              ? (career.requirements as string)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
              : [],
          benefits: Array.isArray(career.benefits)
            ? career.benefits
            : typeof career.benefits === "string"
              ? (career.benefits as string)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
              : [],
          skills: Array.isArray(career.skills)
            ? career.skills
            : typeof career.skills === "string"
              ? (career.skills as string)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
              : [],
        })
      );
      setCareers(transformedCareers);
    } catch (err) {
      console.error("Error fetching careers:", err);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/applied_jobs/`
      );
      const appliedJobsArray = Array.isArray(res.data) ? res.data : (res.data?.applied_jobs || res.data?.applications || res.data?.data || []);
      setAppliedJobs(appliedJobsArray);
    } catch (err) {
      console.error("Error fetching applied jobs:", err);
    }
  };

  useEffect(() => {
    fetchCareers();
    fetchAppliedJobs();
  }, []);

  // ===== DELETE CAREER =====
  const deleteCareer = async (careerId: number) => {
    if (!confirm('Are you sure you want to delete this career? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/careers/${careerId}/`
      );

      if (response.status === 200 || response.status === 204) {
        alert('Career deleted successfully!');
        fetchCareers(); // Refresh the list
      } else {
        throw new Error('Failed to delete career');
      }
    } catch (err: unknown) {
      console.error("Error deleting career:", err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          alert('Career not found. It may have already been deleted.');
        } else if (err.response?.status === 403) {
          alert('You do not have permission to delete this career.');
        } else {
          alert(`Failed to delete career: ${err.response?.data?.message || err.message || 'Please try again.'}`);
        }
      } else {
        console.error('Unexpected error deleting career:', err);
      }
    }
  };

  // ===== HANDLE CAREER FORM CHANGE =====
  const handleCareerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (["responsibilities", "requirements", "benefits", "skills"].includes(name)) {
      setNewCareer((prev) => ({
        ...prev,
        [name]: value.split(",").map((s) => s.trim()).filter(Boolean)
      }));
    } else {
      setNewCareer((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ===== SAVE NEW CAREER =====
  const saveCareer = async () => {
    if (!newCareer.title || !newCareer.department || !newCareer.description) {
      alert("Please fill in all required fields (Title, Department, Description)");
      return;
    }

    setLoading(true);
    try {
      // Prepare payload - convert arrays to strings for API
      const payload = {
        ...newCareer,
        responsibilities: newCareer.responsibilities.join(", "),
        requirements: newCareer.requirements.join(", "),
        benefits: newCareer.benefits.join(", "),
        skills: newCareer.skills.join(", "),
        posted_date: new Date().toISOString().split('T')[0],
        category: newCareer.department,
        apply_link: `${process.env.NEXT_PUBLIC_API_URL}/careers/apply`
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/careers/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      alert("Career Created Successfully!");
      setShowCareerForm(false);
      setNewCareer({
        title: "",
        department: "",
        description: "",
        responsibilities: [],
        requirements: [],
        benefits: [],
        skills: [],
        location: "",
        type: "",
        experience: "",
        salary: "",
        education: "",
      });
      fetchCareers();
    } catch (err: unknown) {
      console.error("Error creating career:", err);
      if (axios.isAxiosError(err)) {
        alert(`Failed to create career: ${err.response?.data?.message || err.message}`);
      } else {
        alert("Failed to create career: An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== HIRE / REJECT APPLIED JOB =====
  const updateHiredStatus = async (email: string, status: boolean) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/applied_jobs/${email}/set_hired/`,
        { hired: status },
        { headers: { "Content-Type": "application/json" } }
      );
      fetchAppliedJobs();
      alert(`Applicant has been ${status ? "hired" : "rejected"}!`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  // ===== FILTERED APPLIED JOBS =====
  const filteredAppliedJobs = appliedJobs.filter(job => {
    const matchesSearch = searchTerm === "" ||
      job.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.course.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "hired" && job.hired) ||
      (filterStatus === "not-hired" && !job.hired);

    return matchesSearch && matchesStatus;
  });

  // Calculate paginated data
  const totalCareerPages = Math.ceil(careers.length / itemsPerPage);
  const paginatedCareers = careers.slice(
    (currentPageCareers - 1) * itemsPerPage,
    currentPageCareers * itemsPerPage
  );

  const totalAppliedPages = Math.ceil(filteredAppliedJobs.length / itemsPerPage);
  const paginatedAppliedJobs = filteredAppliedJobs.slice(
    (currentPageApplied - 1) * itemsPerPage,
    currentPageApplied * itemsPerPage
  );

  // Predefined options for form
  const jobTypes = ["Full-time", "Part-time", "Contract", "Remote", "Hybrid"];
  const departments = ["Tech", "Marketing", "Sales", " HR", "Finance", "Operations", "Customer Support"];
  const experienceLevels = ["Entry Level", "Junior", "Mid Level", "Senior", "Lead", "Executive"];

  // Helper function to get field value safely
  const getFieldValue = (fieldName: string): string => {
    const value = newCareer[fieldName as keyof Career];
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return value as string;
  };

  // Helper function to render list items safely
  const renderListItems = (
    data: string[] | string | undefined,
    renderItem: (item: string, index: number) => React.ReactNode
  ) => {
    if (Array.isArray(data)) {
      return data.map((item, index) => renderItem(item, index));
    } else if (typeof data === 'string') {
      return data.split(',').map((item, index) => renderItem(item.trim(), index));
    } else {
      return [renderItem('No items listed', 0)];
    }
  };

  return (
    <DashboardLayout role="hr">
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 md:p-8 lg:p-10 w-full relative">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
            <div className="w-full lg:w-auto text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
                HR Career Dashboard
              </h1>
              <p className="text-slate-500 text-sm sm:text-md font-medium tracking-wide">
                Manage careers and track applications
              </p>
            </div>
            <div className="flex justify-center sm:justify-end w-full lg:w-auto">
              <button
                onClick={() => setShowCareerForm(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 shadow-sm text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Create New Job
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Jobs",
                value: careers.length,
                icon: Briefcase,
                color: "blue",
                bg: "bg-indigo-50",
                iconColor: "text-indigo-600"
              },
              {
                label: "Applications",
                value: appliedJobs.length,
                icon: Users,
                color: "green",
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600"
              },
              {
                label: "Hired",
                value: appliedJobs.filter(job => job.hired).length,
                icon: CheckCircle,
                color: "purple",
                bg: "bg-purple-50",
                iconColor: "text-purple-600"
              },
              {
                label: "Pending",
                value: appliedJobs.filter(job => !job.hired).length,
                icon: Calendar,
                color: "orange",
                bg: "bg-amber-50",
                iconColor: "text-amber-600"
              },
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1 truncate">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1 truncate">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ml-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            {/* ===== CAREERS SECTION ===== */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 truncate tracking-tight">Career Opportunities</h2>
                    <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Manage job postings and positions</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Briefcase className="w-4 h-4" />
                    <span>{careers.length} positions</span>
                  </div>
                </div>
              </div>

              {/* Mobile Cards View */}
              {isMobile ? (
                <div className="p-4 space-y-4">
                  {paginatedCareers.map((career) => (
                    <div key={career.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-800 truncate">{career.title}</h3>
                          <p className="text-blue-600 font-semibold text-sm mt-1">{career.department}</p>
                        </div>
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex-shrink-0 ml-2">
                          {career.type}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{career.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span>{career.experience}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCareerDetail(career)}
                          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => career.id && deleteCareer(career.id)}
                          className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-5 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-5 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                          Department
                        </th>
                        <th className="px-5 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                          Type
                        </th>
                        <th className="px-5 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {paginatedCareers.map((career) => (
                        <tr key={career.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {career.title}
                              </div>
                              <div className="text-xs text-gray-500 lg:hidden mt-1">{career.department}</div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {career.department}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {career.type}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowCareerDetail(career)}
                                className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                View
                              </button>
                              <button
                                onClick={() => career.id && deleteCareer(career.id)}
                                className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {careers.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No career opportunities yet</h3>
                  <p className="text-gray-500 text-sm sm:text-base mb-4">Create your first job posting to attract talent</p>
                  <button
                    onClick={() => setShowCareerForm(true)}
                    className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                  >
                    Create Job Posting
                  </button>
                </div>
              )}

              {/* Pagination for Careers */}
              <Pagination
                currentPage={currentPageCareers}
                totalPages={totalCareerPages}
                onPageChange={setCurrentPageCareers}
                totalItems={careers.length}
                itemsPerPage={itemsPerPage}
                itemName="positions"
              />
            </section>

            {/* ===== APPLIED JOBS SECTION ===== */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 truncate tracking-tight">Job Applications</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">Review and manage applications</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Users className="w-4 h-4" />
                    <span>{appliedJobs.length} applicants</span>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or course..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-slate-50 focus:bg-white w-full sm:w-auto outline-none font-semibold text-slate-700"
                    >
                      <option value="all">All Status</option>
                      <option value="hired">Hired</option>
                      <option value="not-hired">Not Hired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Cards View */}
              {isMobile ? (
                <div className="p-4 space-y-4">
                  {paginatedAppliedJobs.map((job) => (
                    <div key={job.email} className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 shadow-sm transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-800 truncate">{job.fullname}</h3>
                          <p className="text-slate-500 font-medium text-sm truncate">{job.email}</p>
                          <p className="text-blue-600 font-semibold text-sm mt-1">{job.course}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex-shrink-0 ml-2 ${job.hired
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                          {job.hired ? 'Hired' : 'Review'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!job.hired && (
                            <button
                              onClick={() => updateHiredStatus(job.email, true)}
                              className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-all shadow-sm hover:shadow-md"
                              title="Hire Applicant"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Hire</span>
                            </button>

                          )}
                          <button
                            onClick={() => setShowAppliedDetail(job)}
                            className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-5 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-5 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                          Course
                        </th>
                        <th className="px-5 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-5 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {paginatedAppliedJobs.map((job) => (
                        <tr key={job.email} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {job.fullname}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{job.email}</div>
                              <div className="text-xs text-gray-500 lg:hidden mt-1 truncate">{job.course}</div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                            {job.course}
                          </td>
                          <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 sm:px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${job.hired
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                              {job.hired ? 'Hired' : 'Under Review'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {!job.hired && (
                                <button
                                  onClick={() => updateHiredStatus(job.email, true)}
                                  className="flex items-center gap-1 sm:gap-2 bg-green-500 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-green-600 transition-all shadow-sm hover:shadow-md"
                                  title="Hire Applicant"
                                >
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="text-xs sm:text-sm font-medium">Hire</span>
                                </button>
                              )}
                              <button
                                onClick={() => setShowAppliedDetail(job)}
                                className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                                title="View Details"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredAppliedJobs.length === 0 && (
                <div className="text-center py-10 sm:py-16">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                    {appliedJobs.length === 0 ? 'No applications yet' : 'No applications found'}
                  </h3>
                  <p className="text-slate-500 font-medium text-sm sm:text-base">
                    {appliedJobs.length === 0
                      ? 'Applications will appear here when candidates apply'
                      : 'Try adjusting your search or filter criteria'
                    }
                  </p>
                </div>
              )}

              {/* Pagination for Applied Jobs */}
              <Pagination
                currentPage={currentPageApplied}
                totalPages={totalAppliedPages}
                onPageChange={setCurrentPageApplied}
                totalItems={filteredAppliedJobs.length}
                itemsPerPage={itemsPerPage}
                itemName="applicants"
              />
            </section>
          </div>
        </div>
      </div>

      {/* ===== CAREER FORM MODAL ===== */}
      {showCareerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-2 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto m-2">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Job Position</h3>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowCareerForm(false)}
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <form className="p-4 sm:p-6 space-y-4 sm:space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Job Title */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    name="title"
                    placeholder="e.g., Senior Frontend Developer"
                    value={newCareer.title}
                    onChange={handleCareerChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={newCareer.department}
                    onChange={handleCareerChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                    <input
                      name="location"
                      placeholder="e.g., Bangalore, India"
                      value={newCareer.location}
                      onChange={handleCareerChange}
                      className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Type *
                  </label>
                  <select
                    name="type"
                    value={newCareer.type}
                    onChange={handleCareerChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                  >
                    <option value="">Select Job Type</option>
                    {jobTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    name="experience"
                    value={newCareer.experience}
                    onChange={handleCareerChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                  >
                    <option value="">Select Experience</option>
                    {experienceLevels.map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Salary Range *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                    <input
                      name="salary"
                      placeholder="e.g., ₹8-15 LPA"
                      value={newCareer.salary}
                      onChange={handleCareerChange}
                      className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Education */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Education Requirements
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                    <input
                      name="education"
                      placeholder="e.g., Bachelor's degree in Computer Science"
                      value={newCareer.education}
                      onChange={handleCareerChange}
                      className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  placeholder="Describe the role, team, and impact..."
                  value={newCareer.description}
                  onChange={handleCareerChange}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  required
                />
              </div>

              {/* Array Fields */}
              {[
                { name: 'responsibilities', label: 'Responsibilities', placeholder: 'Develop web applications, Code review, Team collaboration...' },
                { name: 'requirements', label: 'Requirements', placeholder: 'React experience, JavaScript proficiency, Problem-solving skills...' },
                { name: 'benefits', label: 'Benefits', placeholder: 'Health insurance, Flexible hours, Remote work...' },
                { name: 'skills', label: 'Skills Required', placeholder: 'JavaScript, React, Node.js, CSS...' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label} (comma separated)
                  </label>
                  <textarea
                    name={field.name}
                    placeholder={field.placeholder}
                    value={getFieldValue(field.name)}
                    onChange={handleCareerChange}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate items with commas</p>
                </div>
              ))}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCareerForm(false)}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm sm:text-base"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCareer}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      Create Job Position
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VIEW CAREER DETAIL MODAL ===== */}
      {showCareerDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-2 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto m-2">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{showCareerDetail.title}</h3>
                  <p className="text-blue-600 font-semibold mt-1 text-sm sm:text-base truncate">{showCareerDetail.department}</p>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 ml-2"
                  onClick={() => setShowCareerDetail(null)}
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
              {/* Key Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                {[
                  { icon: MapPin, label: "Location", value: showCareerDetail.location },
                  { icon: Briefcase, label: "Type", value: showCareerDetail.type },
                  { icon: User, label: "Experience", value: showCareerDetail.experience },
                  { icon: IndianRupee, label: "Salary", value: showCareerDetail.salary },
                  { icon: BookOpen, label: "Education", value: showCareerDetail.education },
                ].map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
                    <p className="text-xs font-medium text-gray-600 mb-1 truncate">{item.label}</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Job Description
                </h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 sm:p-4 text-sm sm:text-base">
                  {showCareerDetail.description}
                </p>
              </div>

              {/* Responsibilities */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Key Responsibilities</h4>
                <div className="grid gap-2 sm:gap-3">
                  {renderListItems(
                    showCareerDetail.responsibilities,
                    (resp, index) => (
                      <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-xl">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm sm:text-base">{resp}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Requirements & Benefits Side by Side */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Requirements</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {renderListItems(
                      showCareerDetail.requirements,
                      (req, index) => (
                        <div key={index} className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          <span>{req}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Benefits</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {renderListItems(
                      showCareerDetail.benefits,
                      (benefit, index) => (
                        <div key={index} className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Skills Required</h4>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {renderListItems(
                    showCareerDetail.skills,
                    (skill, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== VIEW APPLIED JOB DETAIL MODAL ===== */}
      {showAppliedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-2 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto m-2">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{showAppliedDetail.fullname}</h3>
                  <p className="text-gray-600 text-sm sm:text-base truncate">{showAppliedDetail.email}</p>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 ml-2"
                  onClick={() => setShowAppliedDetail(null)}
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Personal Info */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h4>
                  {[
                    { icon: User, label: "Full Name", value: showAppliedDetail.fullname },
                    { icon: Mail, label: "Email", value: showAppliedDetail.email },
                    { icon: Phone, label: "Phone", value: showAppliedDetail.phone_number },
                    { icon: User, label: "Gender", value: showAppliedDetail.gender },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{item.label}</p>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Information</h4>
                  {[
                    { icon: GraduationCap, label: "Course", value: showAppliedDetail.course },
                    { icon: Briefcase, label: "Work Experience", value: showAppliedDetail.work_experience || 'Not specified' },
                    { icon: FileText, label: "Specialization", value: showAppliedDetail.specialization },
                    { icon: CheckCircle, label: "Training Availability", value: showAppliedDetail.available_for_training },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{item.label}</p>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">Application Status</p>
                    <span className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${showAppliedDetail.hired
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {showAppliedDetail.hired ? '✅ Hired' : '⏳ Under Review'}
                    </span>
                  </div>

                  {showAppliedDetail.resume && (
                    <a
                      href={showAppliedDetail.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base justify-center"
                    >
                      <Eye className="w-4 h-4" />
                      View Resume
                    </a>
                  )}
                </div>
              </div>

              {showAppliedDetail.report && (
                <div className="border-t border-gray-200 pt-4 sm:pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h4>
                  <p className="text-gray-600 bg-gray-50 rounded-xl p-3 sm:p-4 text-sm sm:text-base">{showAppliedDetail.report}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
