"use client";

import React, { useEffect, useState } from 'react';
// Reusable date formatter for consistent dd/mm/yyyy formatting
const formatDate = (dateStr?: string | number | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import {
  Users,
  FileText,
  Mail,
  Phone,
  Briefcase,
  Building,
  Download,
  Upload,
  X,
  Filter,
  UserCheck,
  Trash2,
  Search
} from 'lucide-react';

type User = {
  id?: number;
  fullname?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  profile_picture?: string;
  role: 'employee' | 'hr' | 'manager' | 'admin' | 'user' | string;
  [key: string]: string | number | undefined;
};

type Document = {
  id?: number;
  title: string;
  file_url: string;
  email: string;
  [key: string]: string | number | undefined;
};

type Award = {
  id?: number;
  title: string;
  description: string;
  file_url?: string;
  email: string;
  photo?: string | null;
  [key: string]: string | number | null | undefined;
};

const DocumentPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('employee');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});
  
  const [issueMessage, setIssueMessage] = useState<{
    open: boolean,
    type: 'success' | 'error',
    message: string,
    docType?: string,
    link?: string
  }>({ open: false, type: 'success', message: '' });

  const [confirmIssue, setConfirmIssue] = useState<{ open: boolean, docType?: string, endpoint?: string }>({ open: false });

  const [awardModal, setAwardModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    photo?: File | null;
  }>({ open: false, title: '', description: '', photo: null });

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    awardId?: number;
    awardTitle?: string;
  }>({ open: false, awardId: undefined, awardTitle: '' });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const endpoints = [
        { url: '/api/accounts/employees/', role: 'employee' as const },
        { url: '/api/accounts/hrs/', role: 'hr' as const },
        { url: '/api/accounts/managers/', role: 'manager' as const },
        { url: '/api/accounts/admins/', role: 'admin' as const },
      ];
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const res = await axios.get<User[]>(`${process.env.NEXT_PUBLIC_API_URL}${endpoint.url}`);
          return res.data.map((item) => ({ ...item, role: endpoint.role }));
        })
      );
      setUsers(results.flat());
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const res = await axios.get<Document[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_documents/`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents', err);
    }
  };

  // Fetch all awards and filter by selected user's email
  const fetchAwards = async (email?: string) => {
    if (!email) return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_awards/`);
      if (res.data && Array.isArray(res.data)) {
        // Filter awards by selected email
        const userAwards = res.data.filter((a: Award) => a.email === email);
        setAwards(userAwards);
      } else {
        setAwards([]);
      }
    } catch (err) {
      console.error('Error fetching awards:', err);
      setAwards([]);
    }
  };

  useEffect(() => {
    if (selectedUser?.email_id) fetchAwards(String(selectedUser.email_id));
  }, [selectedUser]);

  // Trigger fetch when selectedUser changes
  useEffect(() => {
    if (selectedUser?.email) {
      fetchAwards(selectedUser.email);
    } else {
      setAwards([]);
    }
  }, [selectedUser]);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchDocuments()]).finally(() => setLoading(false));
  }, []);

  // Issue award
  const issueAward = async () => {
    if (!selectedUser) return;
    if (!awardModal.title || !awardModal.description) {
      setIssueMessage({ open: true, type: 'error', message: 'Please provide title and description for the award.' });
      return;
    }
    setLoadingDocs(prev => ({ ...prev, award: true }));
    try {
      const formData = new FormData();
      formData.append('email', selectedUser.email!);
      formData.append('title', awardModal.title);
      formData.append('description', awardModal.description);
      if (awardModal.photo) formData.append('photo', awardModal.photo);

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_award/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIssueMessage({ open: true, type: 'success', message: 'Award issued successfully!', link: res.data?.file_url });
      setAwardModal({ open: false, title: '', description: '', photo: null });
      fetchAwards(selectedUser.email);
    } catch (err: unknown) {
      let msg = 'Failed to issue award';
      if (axios.isAxiosError(err)) msg = err.response?.data?.message || msg;
      setIssueMessage({ open: true, type: 'error', message: msg });
    } finally {
      setLoadingDocs(prev => ({ ...prev, award: false }));
    }
  };

  // Delete award function
  const deleteAward = async (awardId: number) => {
    setLoadingDocs(prev => ({ ...prev, [`delete-${awardId}`]: true }));
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/delete_award/${awardId}/`);
      
      setIssueMessage({ 
        open: true, 
        type: 'success', 
        message: 'Award deleted successfully!' 
      });
      
      // Refresh awards list
      if (selectedUser?.email) {
        fetchAwards(selectedUser.email);
      }
      
      setDeleteConfirm({ open: false, awardId: undefined, awardTitle: '' });
    } catch (err: unknown) {
      let msg = 'Failed to delete award';
      if (axios.isAxiosError(err)) msg = err.response?.data?.message || msg;
      setIssueMessage({ open: true, type: 'error', message: msg });
    } finally {
      setLoadingDocs(prev => ({ ...prev, [`delete-${awardId}`]: false }));
    }
  };

  const issueDocument = async (docType: string, endpoint: string) => {
    setLoadingDocs(prev => ({ ...prev, [docType]: true }));
    try {
      const res = await axios.post<{ message?: string; file_url?: string }>(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        { email: selectedUser?.email }
      );
      setIssueMessage({
        open: true,
        type: 'success',
        message: res.data?.message || `${docType.replace(/_/g, ' ')} issued successfully!`,
        docType,
        link: res.data?.file_url,
      });
      await fetchDocuments();
    } catch (err: unknown) {
      let msg = `Failed to issue ${docType.replace(/_/g, ' ')}`;
      if (axios.isAxiosError(err)) msg = err.response?.data?.message || msg;
      setIssueMessage({ open: true, type: 'error', message: msg, docType });
    } finally {
      setLoadingDocs(prev => ({ ...prev, [docType]: false }));
    }
  };

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);
  const searchedUsers = filteredUsers.filter(user =>
    (user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      hr: 'bg-blue-100 text-blue-800 border-blue-200',
      manager: 'bg-green-100 text-green-800 border-green-200',
      employee: 'bg-orange-100 text-orange-800 border-orange-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[role] || colors.user;
  };

 const getRoleIcon = (role: string) => {
  const icons: Record<string, string> = {
    admin: '👑', 
    hr: '💼', 
    manager: '👔', 
    employee: '👷', // This is the worker emoji you wanted
    user: '👤'
  };
  return icons[role] || icons.user;
};

  if (loading) {
    return (
      <DashboardLayout role="hr">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="hr">
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
          <div className="w-full lg:w-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">HR Documents Dashboard</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base">Manage employees and their documents</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-lg border border-gray-200 shadow-sm w-full lg:w-auto min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
              {typeof window !== "undefined" ? (localStorage.getItem('user_name')?.charAt(0).toUpperCase()) : 'U'}
            </div>
            <span className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate min-w-0">
              {typeof window !== "undefined" ? (localStorage.getItem('user_email') || 'User') : 'User'}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[
            { 
              label: 'Total Users', 
              value: users.length, 
              icon: Users, 
              color: 'blue',
              bg: 'bg-blue-50',
              iconColor: 'text-blue-600'
            },
            { 
              label: 'Documents', 
              value: documents.length, 
              icon: FileText, 
              color: 'green',
              bg: 'bg-green-50',
              iconColor: 'text-green-600'
            },
            { 
              label: 'Active Filter', 
              value: filter === 'all' ? 'All Roles' : filter,
              icon: Filter, 
              color: 'purple',
              bg: 'bg-purple-50',
              iconColor: 'text-purple-600'
            },
            { 
              label: 'Showing', 
              value: `${searchedUsers.length}/${users.length}`,
              icon: UserCheck, 
              color: 'orange',
              bg: 'bg-orange-50',
              iconColor: 'text-orange-600'
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${stat.bg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {['employee', 'hr', 'manager', 'admin', 'all'].map((r) => (
  <button
    key={r}
    className={`px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
      filter === r
        ? 'bg-blue-500 text-white shadow-md'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
    }`}
    onClick={() => setFilter(r)}
  >
    <span className="text-xs sm:text-sm">{getRoleIcon(r)}</span>
    <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
  </button>
))}

          </div>
        </div>

        {/* User Cards Grid - UPDATED SECTION */}
<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
  {searchedUsers.map((user, index) => (
    <div
      key={user.id ?? `${user.email ?? 'user'}-${index}`}
      className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden group"
      onClick={() => setSelectedUser(user)}
    >
      <div className="p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3">
        {/* Profile Picture and Basic Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user.profile_picture ? (
            <Image
              src={user.profile_picture}
              alt={user.fullname || 'User'}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
              width={56}
              height={56}
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base border-2 border-white shadow-md flex-shrink-0">
              {user.fullname?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base group-hover:text-blue-600 transition">
              {user.fullname || 'Unknown User'}
            </h3>
            <p className="text-xs text-gray-500 truncate">{user.email || 'No Email'}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-1">
          {user.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{user.phone}</span>
            </div>
          )}
          
          {user.department && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Building className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{user.department}</span>
            </div>
          )}
          
          {user.designation && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Briefcase className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{user.designation}</span>
            </div>
          )}
        </div>

        {/* Role Badge - Updated to match your format */}
        <div className="flex items-center justify-between mt-2">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
          <span className="text-sm">{getRoleIcon(user.role)}</span>
<span className="ml-1 text-sm font-medium">
  {user.role.toUpperCase()}
</span>

        </div>
        </div>
        
          {/* Login status indicator (you can customize this based on your data) */}
          <div className="flex items-center gap-1 text-xs text-gray-500 m ">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="sm:inline">Active</span>
          </div>
      </div>
    </div>
  ))}
</div>

        {searchedUsers.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-400" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 text-xs sm:text-sm md:text-base">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Selected User Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-3 md:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-2xl md:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-1 sm:mx-2 md:mx-0">
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                  {selectedUser.profile_picture ? (
                    <Image
                      src={selectedUser.profile_picture}
                      alt={selectedUser.fullname || 'User'}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border-2 sm:border-4 border-white shadow-md flex-shrink-0"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-base sm:text-lg md:text-xl border-2 sm:border-4 border-white shadow-md flex-shrink-0">
                      {selectedUser.fullname?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">{selectedUser.fullname}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                     <div className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getRoleColor(selectedUser.role)}`}>
                          <span>{getRoleIcon(selectedUser.role)}</span>
                          <span>{selectedUser.role.toUpperCase()}</span>
                        </div>

                      <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition shadow-sm flex-shrink-0 ml-2"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Personal Information
                      </h3>
                      <div className="space-y-1 sm:space-y-2 md:space-y-3 bg-gray-50 rounded-lg p-3 sm:p-4">
                        {Object.entries(selectedUser)
                          .filter(([key]) => !['id', 'role', 'profile_picture'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-100 last:border-b-0">
                              <span className="font-medium text-gray-700 text-xs sm:text-sm capitalize truncate pr-2">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-gray-900 text-right text-xs sm:text-sm truncate max-w-[50%]">
                                {key.includes('date') ? formatDate(value?.toString()) : (value?.toString() || 'Not provided')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Document Management */}
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        Document Management
                      </h3>
                      <div className="space-y-2 max-h-48 sm:max-h-64 md:max-h-96 overflow-y-auto pr-1">
                        {[
                          "resume",
                          "appointment_letter",
                          "offer_letter",
                          "releaving_letter",
                          "resignation_letter",
                          "id_proof",
                          "achievement_crt",
                          "bonafide_crt",
                          "marks_card",
                          "certificates",
                          "tenth",
                          "twelth",
                          "degree",
                          "masters",
                          "award",
                        ].map((docType) => {
                          const docValue = documents.find(doc => doc.email === selectedUser.email)?.[docType];
                          const isIssueDoc =
                            ["appointment_letter", "offer_letter", "bonafide_crt", "releaving_letter"].includes(docType);

                          const issueEndpoints: Record<string, string> = {
                            appointment_letter: "/api/accounts/appointment_letter/",
                            offer_letter: "/api/accounts/offer_letter/",
                            releaving_letter: "/api/accounts/releaving_letter/",
                            bonafide_crt: "/api/accounts/bonafide_certificate/",
                          };

                          const handleIssueDoc = async (docType: string) => {
                            const endpoint = issueEndpoints[docType];
                            if (!endpoint) return;

                            const docValue = documents.find(doc => doc.email === selectedUser.email)?.[docType];

                            if (docValue) {
                              setConfirmIssue({ open: true, docType, endpoint });
                              return;
                            }

                            await issueDocument(docType, endpoint);
                          };

                          return (
                            <div key={docType} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-700 text-xs sm:text-sm capitalize block truncate">
                                  {docType.replace(/_/g, ' ')}
                                </span>
                                {docValue ? (
                                  <a
                                    href={String(docValue)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm flex items-center gap-1 mt-1"
                                  >
                                    <Download className="w-3 h-3" />
                                    View Document
                                  </a>
                                ) : (
                                  <span className="text-gray-500 text-xs sm:text-sm">Not uploaded</span>
                                )}
                              </div>

                              {isIssueDoc && (
                                <button
                                  onClick={() => handleIssueDoc(docType)}
                                  className={`px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-sm transition flex-shrink-0 ml-2 ${
                                    loadingDocs[docType]
                                      ? "opacity-70 cursor-not-allowed"
                                      : "hover:bg-blue-600"
                                  }`}
                                  disabled={!!loadingDocs[docType]}
                                >
                                  {loadingDocs[docType] ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                                      <span className="hidden xs:inline">Issuing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="hidden xs:inline">Issue</span>
                                      <span className="xs:hidden">Issue</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Awards Section */}
                      <div className="space-y-2 sm:space-y-3 md:space-y-4 mt-3 sm:mt-4 md:mt-6">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                          🏆 Awards
                        </h3>

                        {awards.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                            {awards.map((award) => (
                              <div
                                key={award.id}
                                className="border border-gray-200 rounded-lg p-2 sm:p-3 md:p-4 bg-white hover:shadow transition"
                              >
                                <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{award.title}</h4>
                                {award.description && (
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{award.description}</p>
                                )}

                                {award.photo && (
                                  <div className="mt-2 sm:mt-3">
                                    <Image
                                      src={award.photo}
                                      alt={award.title}
                                      width={300}
                                      height={200}
                                      className="rounded-lg object-cover border w-full h-20 sm:h-24 md:h-32"
                                    />
                                  </div>
                                )}

                                <p className="text-xs text-gray-500 mt-2">
                                  Awarded on {formatDate(award.created_at)}
                                </p>
                                <div className="flex justify-end mt-2 sm:mt-3 gap-1 sm:gap-2">
                                  <button
                                    onClick={() =>
                                      setDeleteConfirm({
                                        open: true,
                                        awardId: award.id,
                                        awardTitle: award.title,
                                      })
                                    }
                                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /> 
                                    <span className="hidden xs:inline">Delete</span>
                                    <span className="xs:hidden">Del</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs sm:text-sm">No awards found for this employee.</p>
                        )}

                        <div className="mt-2 sm:mt-3 md:mt-4">
                          <button
                            onClick={() => setAwardModal({ open: true, title: '', description: '', photo: null })}
                            className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-yellow-600 w-full sm:w-auto justify-center"
                          >
                            🎖 Issue Award
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Award Modal */}
        {awardModal.open && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-3 md:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 max-w-full sm:max-w-md w-full shadow-xl mx-1 sm:mx-2 md:mx-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Issue Award to {selectedUser.fullname}</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Award Title</label>
                  <input
                    type="text"
                    placeholder="Enter award title"
                    value={awardModal.title}
                    onChange={(e) => setAwardModal({ ...awardModal, title: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Award Description</label>
                  <textarea
                    placeholder="Enter award description"
                    value={awardModal.description}
                    onChange={(e) => setAwardModal({ ...awardModal, description: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none resize-none text-sm sm:text-base"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Award Photo (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-3 md:p-4 text-center hover:border-yellow-400 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAwardModal({ ...awardModal, photo: e.target.files?.[0] })}
                      className="hidden"
                      id="award-photo"
                    />
                    <label htmlFor="award-photo" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400 mb-1 sm:mb-2" />
                        <span className="text-xs sm:text-sm text-gray-600">
                          {awardModal.photo ? awardModal.photo.name : 'Click to upload award photo'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</span>
                      </div>
                    </label>
                  </div>
                  {awardModal.photo && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[70%]">{awardModal.photo.name}</span>
                      <button
                        onClick={() => setAwardModal({ ...awardModal, photo: null })}
                        className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex justify-end gap-2">
                <button
                  className="px-3 sm:px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition text-sm"
                  onClick={() => setAwardModal({ open: false, title: '', description: '', photo: null })}
                >
                  Cancel
                </button>
                <button
                  className={`px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-sm flex items-center gap-2 hover:bg-yellow-600 transition text-sm ${
                    loadingDocs['award'] ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={loadingDocs['award']}
                  onClick={issueAward}
                >
                  {loadingDocs['award'] ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                      Issuing...
                    </>
                  ) : (
                    'Issue Award'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-3 md:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 max-w-full sm:max-w-md w-full shadow-xl mx-1 sm:mx-2 md:mx-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Delete Award</h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                Are you sure you want to delete the award &quot;{deleteConfirm.awardTitle}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-3 sm:px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition text-sm"
                  onClick={() => setDeleteConfirm({ open: false, awardId: undefined, awardTitle: '' })}
                >
                  Cancel
                </button>
                <button
                  className={`px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2 hover:bg-red-600 transition text-sm ${
                    loadingDocs[`delete-${deleteConfirm.awardId}`] ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={loadingDocs[`delete-${deleteConfirm.awardId}`]}
                  onClick={() => deleteAward(deleteConfirm.awardId!)}
                >
                  {loadingDocs[`delete-${deleteConfirm.awardId}`] ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Issue Doc Modal */}
        {issueMessage.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-3 md:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 max-w-full sm:max-w-md w-full shadow-xl mx-1 sm:mx-2 md:mx-0">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {issueMessage.docType?.replace(/_/g, ' ') || 'Document'}
                </h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setIssueMessage({ ...issueMessage, open: false })}>
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <p className={`text-xs sm:text-sm ${issueMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {issueMessage.message}
              </p>
              {issueMessage.link && (
                <a 
                  href={issueMessage.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline mt-2 inline-block text-xs sm:text-sm"
                >
                  View Document
                </a>
              )}
              <div className="mt-3 sm:mt-4 text-right">
                <button 
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg text-sm" 
                  onClick={() => setIssueMessage({ ...issueMessage, open: false })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for re-issue */}
        {confirmIssue.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-3 md:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 max-w-full sm:max-w-md w-full shadow-xl mx-1 sm:mx-2 md:mx-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                {confirmIssue.docType?.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                Document already exists. Do you want to regenerate/issue again?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-3 sm:px-4 py-2 bg-gray-300 rounded-lg text-sm"
                  onClick={() => setConfirmIssue({ open: false })}
                >
                  Cancel
                </button>
                <button
                  className={`px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow-sm transition text-sm ${
                    confirmIssue.docType && loadingDocs[confirmIssue.docType] ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
                  }`}
                  disabled={confirmIssue.docType ? !!loadingDocs[confirmIssue.docType] : false}
                  onClick={async () => {
                    if (!selectedUser || !confirmIssue.docType || !confirmIssue.endpoint) return;
                    setLoadingDocs(prev => ({ ...prev, [confirmIssue.docType!]: true }));
                    await issueDocument(confirmIssue.docType, confirmIssue.endpoint);
                    setLoadingDocs(prev => ({ ...prev, [confirmIssue.docType!]: false }));
                    setConfirmIssue({ open: false });
                  }}
                >
                  {confirmIssue.docType && loadingDocs[confirmIssue.docType] ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                      Issuing...
                    </>
                  ) : (
                    'Issue Again'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentPage;