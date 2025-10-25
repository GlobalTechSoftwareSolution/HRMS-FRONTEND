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
  DollarSign,
  BookOpen,
  Clock,
  Trash2
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
      // Transform string data to arrays
      const transformedCareers = res.data.map((career: any) => ({
        ...career,
        responsibilities: Array.isArray(career.responsibilities) 
          ? career.responsibilities 
          : career.responsibilities?.split(",").map((s: string) => s.trim()).filter(Boolean) || [],
        requirements: Array.isArray(career.requirements) 
          ? career.requirements 
          : career.requirements?.split(",").map((s: string) => s.trim()).filter(Boolean) || [],
        benefits: Array.isArray(career.benefits) 
          ? career.benefits 
          : career.benefits?.split(",").map((s: string) => s.trim()).filter(Boolean) || [],
        skills: Array.isArray(career.skills) 
          ? career.skills 
          : career.skills?.split(",").map((s: string) => s.trim()).filter(Boolean) || [],
      }));
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
      setAppliedJobs(res.data);
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
    } catch (err: any) {
      console.error("Error deleting career:", err);
      
      if (err.response?.status === 404) {
        alert('Career not found. It may have already been deleted.');
      } else if (err.response?.status === 403) {
        alert('You do not have permission to delete this career.');
      } else {
        alert(`Failed to delete career: ${err.response?.data?.message || err.message || 'Please try again.'}`);
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
    } catch (err: any) {
      console.error("Error creating career:", err);
      alert(`Failed to create career: ${err.response?.data?.message || err.message}`);
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

  // Predefined options for form
  const jobTypes = ["Full-time", "Part-time", "Contract", "Remote", "Hybrid"];
  const departments = ["Engineering", "Design", "Marketing", "Sales", "HR", "Finance", "Operations"];
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
  const renderListItems = (data: any, renderItem: (item: string, index: number) => JSX.Element) => {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                HR Career Dashboard
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Manage careers and track applications
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <button
                onClick={() => setShowCareerForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Create New Job
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Mobile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {[
            { 
              label: "Total Jobs", 
              value: careers.length, 
              icon: Briefcase, 
              color: "blue",
              bg: "from-blue-500 to-blue-600"
            },
            { 
              label: "Applications", 
              value: appliedJobs.length, 
              icon: Users, 
              color: "green",
              bg: "from-green-500 to-green-600"
            },
            { 
              label: "Hired", 
              value: appliedJobs.filter(job => job.hired).length, 
              icon: CheckCircle, 
              color: "purple",
              bg: "from-purple-500 to-purple-600"
            },
            { 
              label: "Pending", 
              value: appliedJobs.filter(job => !job.hired).length, 
              icon: Calendar, 
              color: "orange",
              bg: "from-orange-500 to-orange-600"
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{stat.label}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{stat.value}</p>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r ${stat.bg} rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ml-2`}>
                  <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* ===== CAREERS SECTION ===== */}
          <section className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Career Opportunities</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage job postings and positions</p>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{careers.length} positions</span>
                </div>
              </div>
            </div>

            {/* Mobile Cards View */}
            {isMobile ? (
              <div className="p-4 space-y-4">
                {careers.map((career) => (
                  <div key={career.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{career.title}</h3>
                        <p className="text-blue-600 font-medium text-sm mt-1">{career.department}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2">
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Department
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Type
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {careers.map((career) => (
                      <tr key={career.id} className="hover:bg-gray-50 transition-colors group">
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
          </section>

          {/* ===== APPLIED JOBS SECTION ===== */}
          <section className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Job Applications</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Review and manage applications</p>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{appliedJobs.length} applicants</span>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-8 sm:pl-10 pr-6 sm:pr-8 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white w-full sm:w-auto"
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
                {filteredAppliedJobs.map((job) => (
                  <div key={job.email} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{job.fullname}</h3>
                        <p className="text-gray-500 text-sm truncate">{job.email}</p>
                        <p className="text-blue-600 font-medium text-sm mt-1">{job.course}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                        job.hired 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Course
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppliedJobs.map((job) => (
                      <tr key={job.email} className="hover:bg-gray-50 transition-colors group">
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
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            job.hired 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
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
              <div className="text-center py-8 sm:py-12">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {appliedJobs.length === 0 ? 'No applications yet' : 'No applications found'}
                </h3>
                <p className="text-gray-500 text-sm sm:text-base">
                  {appliedJobs.length === 0 
                    ? 'Applications will appear here when candidates apply' 
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            )}
          </section>
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
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
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
                    { icon: DollarSign, label: "Salary", value: showCareerDetail.salary },
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
                      <span className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                        showAppliedDetail.hired 
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
      </div>
    </DashboardLayout>
  );
}