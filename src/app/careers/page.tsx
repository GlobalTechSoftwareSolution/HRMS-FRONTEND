"use client";

import React, { useState, useEffect } from "react";
 import { ReactNode } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  X, 
  DollarSign, 
  User, 
  Mail, 
  Phone, 
  GraduationCap,
  FileText,
  CheckCircle,
  Loader,
  Search,
  ArrowLeft,
  ExternalLink,
  Upload,
  File
} from "lucide-react";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/footer";

interface Career {
  id: number;
  title: string;
  department: string;
  description: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills?: string[];
  posted_date?: string;
}

const CareersPage = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedJob, setSelectedJob] = useState<Career | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [careersLoading, setCareersLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    location: "",
    type: ""
  });
  
  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const [formData, setFormData] = useState({
    email: "",
    fullname: "",
    gender: "",
    phone_number: "",
    course: "",
    resume: null as File | null,
    available_for_training: "Yes",
    work_experience: "",
    specialization: "",
  });

  // ===== FETCH CAREERS =====
  useEffect(() => {
    const fetchCareers = async () => {
      try {
        setCareersLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/careers/`);
        if (!response.ok) throw new Error('Failed to fetch careers');
        const data = await response.json();
        setCareers(data);
      } catch (err) {
        console.error("Error fetching careers:", err);
        showNotification('error', 'Failed to load career opportunities');
      } finally {
        setCareersLoading(false);
      }
    };

    fetchCareers();
  }, []);

  useEffect(() => {
  if (selectedJob) {
    console.log('Selected Job Data:', selectedJob);
    console.log('Responsibilities:', selectedJob.responsibilities);
    console.log('Requirements:', selectedJob.requirements);
    console.log('Responsibilities type:', typeof selectedJob.responsibilities);
    console.log('Requirements type:', typeof selectedJob.requirements);
  }
}, [selectedJob]);

  // ===== NOTIFICATION HANDLER =====
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: 'success', message: '' });
    }, 4000);
  };

  // ===== FILTERED CAREERS =====
  const filteredCareers = careers.filter(career => {
    const matchesSearch = filters.search === '' || 
      career.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      career.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      career.department.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesDepartment = filters.department === '' || career.department === filters.department;
    const matchesLocation = filters.location === '' || career.location === filters.location;
    const matchesType = filters.type === '' || career.type === filters.type;

    return matchesSearch && matchesDepartment && matchesLocation && matchesType;
  });

  // ===== HANDLE FORM CHANGE =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===== HANDLE FILE UPLOAD =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Check file type
      const allowedTypes = ['.pdf', '.doc', '.docx', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension) && !allowedTypes.includes(file.type)) {
        showNotification('error', 'Please upload a PDF, DOC, or DOCX file');
        return;
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'File size should be less than 5MB');
        return;
      }

      setFormData((prev) => ({ ...prev, resume: file }));
    }
  };

  // ===== REMOVE UPLOADED FILE =====
  const removeResume = () => {
    setFormData((prev) => ({ ...prev, resume: null }));
  };

  // ===== SUBMIT APPLICATION =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.resume) {
      showNotification('error', 'Please upload your resume');
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('email', formData.email);
      submitData.append('fullname', formData.fullname);
      submitData.append('gender', formData.gender);
      submitData.append('phone_number', formData.phone_number);
      submitData.append('course', formData.course);
      submitData.append('resume', formData.resume);
      submitData.append('available_for_training', formData.available_for_training);
      submitData.append('work_experience', formData.work_experience);
      submitData.append('specialization', formData.specialization);
      submitData.append('hired', 'false');

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/applied_jobs/`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showNotification('success', 'Application submitted successfully!');
      setShowApplyForm(false);
      setFormData({
        email: "",
        fullname: "",
        gender: "",
        phone_number: "",
        course: "",
        resume: null,
        available_for_training: "Yes",
        work_experience: "",
        specialization: "",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      showNotification('error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ===== RESET FILTERS =====
  const resetFilters = () => {
    setFilters({ search: "", department: "", location: "", type: "" });
  };

  // ===== DIRECT APPLY FUNCTION =====
  const handleDirectApply = (job: Career) => {
    setSelectedJob(job);
    setShowApplyForm(true);
    
    // Reset form data when applying for a new job
    setFormData({
      email: "",
      fullname: "",
      gender: "",
      phone_number: "",
      course: "",
      resume: null,
      available_for_training: "Yes",
      work_experience: "",
      specialization: "",
    });
  };

  // ===== CLOSE APPLICATION FORM =====
  const closeApplicationForm = () => {
    setShowApplyForm(false);
    setSelectedJob(null);
  };

  // Helper function to safely render list items

const renderListItems = (
  data: string | string[],
  renderItem: (item: string, index: number) => ReactNode
): ReactNode[] => {
  if (Array.isArray(data)) {
    return data.map((item, index) => renderItem(item, index));
  } else if (typeof data === 'string') {
    return data.split(',').map((item, index) => renderItem(item.trim(), index));
  } else {
    return [renderItem('No items listed', 0)];
  }
};


  // Get unique values for filters
  const departments = [...new Set(careers.map(career => career.department))];
  const locations = [...new Set(careers.map(career => career.location))];
  // const types = [...new Set(careers.map(career => career.type))];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-black">
        {/* Notification Popup */}
        {notification.show && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div className={`flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm ${
              notification.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <X className="w-6 h-6 text-red-600" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4 mr-2" />
              We&apos;re Hiring! {careers.length} Open Positions
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Join Our <span className="text-blue-600">Team</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Build your career with a team that values innovation, collaboration, and professional growth. 
              Discover opportunities that match your skills and ambitions.
            </p>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-8 sm:mb-12">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 w-full">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search jobs, skills..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
                
                {/* Department Filter */}
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                
                {/* Location Filter */}
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={resetFilters}
                className="px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Loading State */}
          {careersLoading ? (
            <div className="flex justify-center items-center py-16 sm:py-24">
              <div className="text-center">
                <Loader className="animate-spin h-8 w-8 sm:h-12 sm:w-12 mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600 text-lg">Loading career opportunities...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Job List View */}
              {!selectedJob && (
                <div className="max-w-7xl mx-auto">
                  {/* Results Count */}
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600 text-sm sm:text-base">
                      Showing {filteredCareers.length} of {careers.length} positions
                    </p>
                  </div>

                  {/* Careers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {filteredCareers.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 hover:border-blue-300 group cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                          <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {job.title}
                            </h2>
                            <p className="text-blue-600 font-medium text-sm mt-1">{job.department}</p>
                          </div>
                          <span className="bg-green-100 text-green-600 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                            New
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-3 leading-relaxed">
                          {job.description}
                        </p>
                        
                        {/* Job Details */}
                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{job.type}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{job.experience}</span>
                          </div>
                          {job.salary && (
                            <div className="flex items-center text-sm text-gray-500">
                              <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span>{job.salary}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedJob(job)}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 sm:py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                          >
                            View Details
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Empty State */}
                  {filteredCareers.length === 0 && (
                    <div className="text-center py-12 sm:py-16">
                      <div className="bg-white rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No positions found</h3>
                        <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                        <button
                          onClick={resetFilters}
                          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Job Details View (Only when user clicks "View Details") */}
              {selectedJob && !showApplyForm && (
                <div className="max-w-4xl mx-auto">
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Jobs</span>
                  </button>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Job Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-8 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            {selectedJob.title}
                          </h1>
                          <p className="text-blue-600 font-semibold text-lg mb-4">{selectedJob.department}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                              {selectedJob.type}
                            </span>
                            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                              {selectedJob.location}
                            </span>
                            <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                              {selectedJob.experience}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDirectApply(selectedJob)}
                          className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all duration-300 font-semibold text-lg flex items-center gap-2 whitespace-nowrap"
                        >
                          Apply Now
                          <Briefcase className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Job Content */}
                    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                      {/* Description */}
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                        <p className="text-gray-600 leading-relaxed">{selectedJob.description}</p>
                      </div>

                      {/* Responsibilities */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Responsibilities</h3>
                        <ul className="space-y-3">
                          {renderListItems(
                            selectedJob.responsibilities,
                            (responsibility, index) => (
                              <li key={index} className="flex items-start text-gray-600">
                                <CheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0 w-5 h-5" />
                                <span>{responsibility}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {/* Requirements */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                        <ul className="space-y-2">
                          {renderListItems(
                            selectedJob.requirements,
                            (requirement, index) => (
                              <li key={index} className="flex items-start text-gray-600">
                                <span className="text-blue-500 mr-2 mt-1">•</span>
                                <span>{requirement}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {renderListItems(
                            selectedJob.benefits,
                            (benefit, index) => (
                              <div key={index} className="flex items-center text-gray-600">
                                <CheckCircle className="text-green-500 mr-3 flex-shrink-0 w-5 h-5" />
                                <span>{benefit}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Application Form Modal/Popup */}
        {showApplyForm && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Apply for {selectedJob.title}</h2>
                    <p className="text-gray-600">{selectedJob.department} • {selectedJob.location}</p>
                  </div>
                  <button
                    onClick={closeApplicationForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Application Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number *
                    </label>
                    <input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="w-4 h-4 inline mr-2" />
                      Course/Education
                    </label>
                    <input
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Your course or degree"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Experience
                    </label>
                    <input
                      name="work_experience"
                      value={formData.work_experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Years of experience"
                    />
                  </div>
                </div>

                {/* Resume Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Upload Resume/CV *
                  </label>
                  
                  {!formData.resume ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 font-medium">
                            Click to upload your resume
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            PDF, DOC, DOCX files only (Max 5MB)
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <File className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formData.resume.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(formData.resume.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeResume}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization/Skills
                  </label>
                  <textarea
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Your skills and areas of expertise"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4">
                  <button
                    type="button"
                    onClick={closeApplicationForm}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.resume}
                    className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin w-5 h-5" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default CareersPage;