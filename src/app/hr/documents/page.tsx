"use client";

import React, { useEffect, useState } from 'react';
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
  Trash2
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
      admin: '👑', hr: '💼', manager: '👔', employee: '👷', user: '👤'
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HR Documents Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage employees and their documents</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {typeof window !== "undefined" ? (localStorage.getItem('user_name')?.charAt(0).toUpperCase()) : 'U'}
            </div>
            <span className="font-medium text-gray-900">{typeof window !== "undefined" ? (localStorage.getItem('user_email') || 'User') : 'User'}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{documents.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Filter</p>
                <p className="text-lg font-bold text-gray-900 mt-1 capitalize">
                  {filter === 'all' ? 'All Roles' : filter}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Showing</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {searchedUsers.length} / {users.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['employee', 'hr', 'manager', 'admin', 'all'].map(r => (
              <button
                key={r}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${filter === r
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                onClick={() => setFilter(r)}
              >
                <span>{getRoleIcon(r)}</span>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchedUsers.map((user, index) => (
            <div
              key={user.id ?? `${user.email ?? 'user'}-${index}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => setSelectedUser(user)}
            >
              <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                {user.profile_picture ? (
                  <Image
                    src={user.profile_picture}
                    alt={user.fullname || 'User'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                    width={64}
                    height={64}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg border-2 border-white shadow-md">
                    {user.fullname?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
                    {user.fullname || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{user.email || 'No Email'}</p>

                  {/* Additional Info */}
                  <div className="mt-4 space-y-2">
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span className="truncate">{user.department}</span>
                      </div>
                    )}
                    {user.designation && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span className="truncate">{user.designation}</span>
                      </div>
                    )}
                  </div>

                  {/* Role Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    <span>{getRoleIcon(user.role)}</span>
                    {user.role.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchedUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Selected User Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-4">
                  {selectedUser.profile_picture ? (
                    <Image
                      src={selectedUser.profile_picture}
                      alt={selectedUser.fullname || 'User'}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xl border-4 border-white shadow-md">
                      {selectedUser.fullname?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedUser.fullname}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(selectedUser.role)}`}>
                        <span>{getRoleIcon(selectedUser.role)}</span>
                        {selectedUser.role.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition shadow-sm"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(selectedUser)
                          .filter(([key]) => !['id', 'role', 'profile_picture'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-700 capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-gray-900 text-right">
                                {value?.toString() || 'Not provided'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Document Management */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        Document Management
                      </h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
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
                            <div key={docType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-700 text-sm capitalize block">
                                  {docType.replace(/_/g, ' ')}
                                </span>
                                {docValue ? (
                                  <a
                                    href={String(docValue)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mt-1"
                                  >
                                    <Download className="w-3 h-3" />
                                    View Document
                                  </a>
                                ) : (
                                  <span className="text-gray-500 text-sm">Not uploaded</span>
                                )}
                              </div>

                              {isIssueDoc && (
                                <button
                                  onClick={() => handleIssueDoc(docType)}
                                  className={`px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition ${loadingDocs[docType]
                                      ? "opacity-70 cursor-not-allowed"
                                      : "hover:bg-blue-600"
                                    }`}
                                  disabled={!!loadingDocs[docType]}
                                >
                                  {loadingDocs[docType] ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                        ></path>
                                      </svg>
                                      Issuing...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      Issue
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Awards Section */}
                      <div className="space-y-4 mt-10">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          🎖 Awards
                        </h3>
                    {/* Awards Section */}
<div className="space-y-4 mt-6">
  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
    🏆 Awards
  </h3>

  {awards.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {awards.map((award) => (
        <div
          key={award.id}
          className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow transition"
        >
          <h4 className="font-bold text-gray-900">{award.title}</h4>
          {award.description && (
            <p className="text-sm text-gray-600 mt-1">{award.description}</p>
          )}

          {award.photo && (
            <div className="mt-3">
              <Image
                src={award.photo}
                alt={award.title}
                width={300}
                height={200}
                className="rounded-lg object-cover border"
              />
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Awarded on {award.created_at ? new Date(award.created_at).toLocaleDateString() : 'N/A'}
          </p>
             <div className="flex justify-end mt-3 gap-2">
            <button
              onClick={() =>
                setDeleteConfirm({
                  open: true,
                  awardId: award.id,
                  awardTitle: award.title,
                })
              }
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-500 text-sm">No awards found for this employee.</p>
  )}
</div>

                        <div className="mt-4">
                          <button
                            onClick={() => setAwardModal({ open: true, title: '', description: '', photo: null })}
                            className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-yellow-600"
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

            {/* Award Modal */}
            {awardModal.open && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Award to {selectedUser.fullname}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Award Title</label>
                      <input
                        type="text"
                        placeholder="Enter award title"
                        value={awardModal.title}
                        onChange={(e) => setAwardModal({ ...awardModal, title: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Award Description</label>
                      <textarea
                        placeholder="Enter award description"
                        value={awardModal.description}
                        onChange={(e) => setAwardModal({ ...awardModal, description: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none resize-none"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Award Photo (Optional)</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-400 transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAwardModal({ ...awardModal, photo: e.target.files?.[0] })}
                          className="hidden"
                          id="award-photo"
                        />
                        <label htmlFor="award-photo" className="cursor-pointer">
                          <div className="flex flex-col items-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">
                              {awardModal.photo ? awardModal.photo.name : 'Click to upload award photo'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</span>
                          </div>
                        </label>
                      </div>
                      {awardModal.photo && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-gray-600">{awardModal.photo.name}</span>
                          <button
                            onClick={() => setAwardModal({ ...awardModal, photo: null })}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                      onClick={() => setAwardModal({ open: false, title: '', description: '', photo: null })}
                    >
                      Cancel
                    </button>
                    <button
                      className={`px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-sm flex items-center gap-2 hover:bg-yellow-600 transition ${loadingDocs['award'] ? 'opacity-70 cursor-not-allowed' : ''}`}
                      disabled={loadingDocs['award']}
                      onClick={issueAward}
                    >
                      {loadingDocs['award'] ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
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
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Award</h3>
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to delete the award &quot;{deleteConfirm.awardTitle}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                  onClick={() => setDeleteConfirm({ open: false, awardId: undefined, awardTitle: '' })}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2 hover:bg-red-600 transition ${loadingDocs[`delete-${deleteConfirm.awardId}`] ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={loadingDocs[`delete-${deleteConfirm.awardId}`]}
                  onClick={() => deleteAward(deleteConfirm.awardId!)}
                >
                  {loadingDocs[`delete-${deleteConfirm.awardId}`] ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{issueMessage.docType?.replace(/_/g, ' ') || 'Document'}</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setIssueMessage({ ...issueMessage, open: false })}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className={`text-sm ${issueMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{issueMessage.message}</p>
              {issueMessage.link && (
                <a href={issueMessage.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 inline-block">
                  View Document
                </a>
              )}
              <div className="mt-4 text-right">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg" onClick={() => setIssueMessage({ ...issueMessage, open: false })}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for re-issue */}
        {confirmIssue.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{confirmIssue.docType?.replace(/_/g, ' ')}</h3>
              <p className="text-sm text-gray-700 mb-4">Document already exists. Do you want to regenerate/issue again?</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                  onClick={() => setConfirmIssue({ open: false })}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow-sm transition ${confirmIssue.docType && loadingDocs[confirmIssue.docType] ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
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
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
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