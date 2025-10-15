"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';

type User = {
  id: number;
  fullname: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  profile_picture?: string;
  role: string;
  [key: string]: any;
};

type Document = {
  id: number;
  title: string;
  file_url: string;
  email: string;
};

const DocumentPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const endpoints = [
        { url: '/api/accounts/users/', role: 'user' },
        { url: '/api/accounts/employees/', role: 'employee' },
        { url: '/api/accounts/hrs/', role: 'hr' },
        { url: '/api/accounts/managers/', role: 'manager' },
        { url: '/api/accounts/admins/', role: 'admin' },
      ];

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const res = await axios.get(`https://globaltechsoftwaresolutions.cloud${endpoint.url}`);
          return res.data.map((item: any) => ({ ...item, role: endpoint.role }));
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
      const res = await axios.get('https://globaltechsoftwaresolutions.cloud/api/accounts/list_documents/');
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchDocuments()]).finally(() => setLoading(false));
  }, []);

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

  if (loading) {
    return (
      <DashboardLayout role="hr">
        <div className="text-center py-20 text-gray-500">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="hr">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">HR Dashboard</h1>
          <span className="text-lg font-medium">PAVAN REDDY</span>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'user', 'employee', 'hr', 'manager', 'admin'].map(r => (
            <button
              key={r}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filter === r
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setFilter(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className="border border-gray-200 rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer flex flex-col items-center text-center gap-2"
              onClick={() => setSelectedUser(user)}
            >
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.fullname}
                  className="w-20 h-20 rounded-full object-cover mb-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-2 text-gray-500">No Pic</div>
              )}
              <h2 className="text-lg font-semibold">{user.fullname}</h2>
              <p className="text-gray-600 text-sm">Email: {user.email}</p>
              {user.phone && <p className="text-gray-600 text-sm">Phone: {user.phone}</p>}
              <p className="text-xs font-medium text-blue-500">Role: {user.role}</p>
            </div>
          ))}
        </div>

        {/* Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative overflow-y-auto max-h-[90vh]">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold text-lg"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
              <div className="flex flex-col items-center gap-4 mb-4">
                {selectedUser.profile_picture && (
                  <img
                    src={selectedUser.profile_picture}
                    alt={selectedUser.fullname}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}
                <h2 className="text-xl font-bold">{selectedUser.fullname}</h2>
                <p className="text-gray-600">{selectedUser.email}</p>
                {selectedUser.phone && <p className="text-gray-600">Phone: {selectedUser.phone}</p>}
                <p className="text-xs font-medium text-blue-500">Role: {selectedUser.role}</p>
              </div>

              {/* Full Info */}
              <div className="flex flex-col gap-2 mb-4">
                {Object.entries(selectedUser).map(([key, value]) => (
                  key !== 'profile_picture' && key !== 'id' && key !== 'role' && (
                    <p key={key} className="text-gray-700 text-sm">
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {value?.toString()}
                    </p>
                  )
                ))}
              </div>

              {/* Documents */}
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Documents</h3>
                {documents
                  .filter(doc => doc.email === selectedUser.email)
                  .map((doc, idx) => {
                    const docEntries = Object.entries(doc)
                      .filter(([key, value]) => key !== 'id' && key !== 'email' && value !== null);
                    return docEntries.length > 0 ? (
                      <ul key={idx} className="list-disc list-inside text-gray-700 text-sm">
                        {docEntries.map(([key, value]) => (
                          <li key={key}>
                            <a
                              href={value as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {key.replace(/_/g, ' ')}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={idx} className="text-gray-500 text-sm">No documents found.</p>
                    );
                  })}
              </div>

              {/* Manage Documents */}
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Documents</h3>
                {selectedUser && (
                  <div className="flex flex-col gap-2">
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
                      const isIssueDoc = ["appointment_letter", "offer_letter", "bonafide_crt", "releaving_letter"].includes(docType);
                      return (
                        <div key={docType} className="flex items-center gap-2">
                          <span className="text-sm capitalize w-40">{docType.replace(/_/g, " ")}:</span>
                          {docValue ? (
                            <a
                              href={docValue}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-500 text-sm">Not issued</span>
                          )}
                          {isIssueDoc && (
                            <>
                              <input
                                type="file"
                                id={`file-${docType}`}
                                className="hidden"
                                onChange={async (e) => {
                                  if (!e.target.files?.[0]) return;
                                  const formData = new FormData();
                                  formData.append(docType, e.target.files[0]);
                                  try {
                                    await axios.patch(
                                      `https://globaltechsoftwaresolutions.cloud/api/accounts/list_documents/${selectedUser.id}/`,
                                      formData,
                                      { headers: { "Content-Type": "multipart/form-data" } }
                                    );
                                    alert(`${docType} issued successfully!`);
                                  } catch (err) {
                                    console.error(err);
                                    alert(`Failed to issue ${docType}`);
                                  }
                                }}
                              />
                              <button
                                onClick={() => document.getElementById(`file-${docType}`)?.click()}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                              >
                                Issue
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentPage;