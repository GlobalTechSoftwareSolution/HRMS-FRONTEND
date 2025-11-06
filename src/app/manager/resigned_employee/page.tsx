"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import axios from "axios";

interface Employee {
  id?: number;
  fullname?: string;
  email: string;
  department?: string;
  designation?: string;
  description?: string;
  releaved?: string;
  role?: string;
  phone?: string;
  date_joined?: string;
  work_location?: string;
  approved?: string;
  reason_for_resignation?: string;
  manager_approved?: string;
  hr_approved?: string;
  applied_at?: string;
  offboarded_datetime?: string;
}

interface ModalState {
  isOpen: boolean;
  type: 'approve' | 'reject' | 'view' | 'success' | 'error' | null;
  employee: Employee | null;
  message: string;
}

const ReleavedList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [description, setDescription] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: null,
    employee: null,
    message: ''
  });
  // Tab state for Pending/Reviewed
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');

  // 🧠 Fetch releaved employees
  const fetchReleavedEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_releaved/`
      );
      // Add derived approval_status property
      const formattedData = (res.data || []).map((emp: Employee) => {
        let approvalStatus = "Pending";
        if (emp.manager_approved === "Approved") approvalStatus = "Approved";
        else if (emp.manager_approved === "Rejected") approvalStatus = "Rejected";
        else if (!emp.manager_approved || emp.manager_approved === "") approvalStatus = "Pending";

        return {
          ...emp,
          approval_status: approvalStatus,
          approved:
            emp.manager_approved === "Approved"
              ? "yes"
              : emp.manager_approved === "Rejected"
              ? "no"
              : "pending",
        };
      });
      setEmployees(formattedData);
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      showModal('error', null, "Failed to fetch employees data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleavedEmployees();
  }, [fetchReleavedEmployees]);

  // 🧩 Update approval + description
  const handleUpdate = async (id: number, email: string, approved: string) => {
    try {
      setLoading(true);
      // Log the PATCH payload before sending
      console.log("📤 PATCH Payload:", {
        approval_stage: "manager",
        approved: approved === "yes" ? "Approved" : "Rejected",
        description: description[email] || "manager rejected resignation due to incomplete documentation",
      });
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/releaved/${id}/`,
        {
          approval_stage: "manager",
          approved: approved === "yes" ? "Approved" : "Rejected",
          description: description[email] || "manager rejected resignation due to incomplete documentation",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("✅ Success:", res.data);
      
      // Show success or error modal based on response
      if (res.data.error) {
        showModal('error', null, res.data.error);
      } else {
        showModal('success', null, res.data.message || `Employee ${approved === 'yes' ? 'approved' : 'rejected'} successfully!`);
      }
      
      fetchReleavedEmployees();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Error updating:", error.response?.data || error.message);
        // Enhanced error logging
        console.log("📥 Full error:", error.toJSON ? error.toJSON() : error);
      } else {
        console.error("❌ Unexpected error:", error);
      }
      showModal('error', null, "Failed to update status and description!");
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type: ModalState['type'], employee: Employee | null, message: string) => {
    setModal({
      isOpen: true,
      type,
      employee,
      message
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: null,
      employee: null,
      message: ''
    });
  };

  const confirmAction = () => {
    if (modal.employee && modal.type && (modal.type === 'approve' || modal.type === 'reject')) {
      handleUpdate(modal.employee.id!, modal.employee.email, modal.type === 'approve' ? 'yes' : 'no');
    }
    closeModal();
  };

  const openViewModal = (employee: Employee) => {
    showModal('view', employee, '');
  };

  const openConfirmationModal = (employee: Employee, type: 'approve' | 'reject') => {
    if (!description[employee.email]?.trim()) {
      showModal('error', null, "Please add a description before taking action");
      return;
    }
    showModal(type, employee, `Are you sure you want to ${type === 'approve' ? 'approve' : 'reject'} ${employee.fullname || employee.email}?`);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        * {
          max-width: 100%;
        }
      `}</style>
    <DashboardLayout role="manager">
      <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen overflow-x-hidden w-full">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Releaved Employees</h1>
            <p className="text-sm sm:text-base text-gray-600">Review and manage employee releaving requests</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 w-full">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 min-w-0">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Requests</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">{employees.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 min-w-0">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Approved</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {employees.filter(emp => emp.approved === 'yes').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 min-w-0">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Rejected</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {employees.filter(emp => emp.approved === 'no').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 min-w-0">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-orange-50 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {employees.filter(emp => !emp.approved || emp.approved === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table with Tab Filtering */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
            {/* Tab Buttons */}
            <div className="flex space-x-2 sm:space-x-4 mb-4 sm:mb-6 px-3 sm:px-4 md:px-6 pt-4 sm:pt-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Pending Requests
              </button>
              <button
                onClick={() => setActiveTab('reviewed')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium ${activeTab === 'reviewed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Reviewed Requests
              </button>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading employees data...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No releaved employees</h3>
                <p className="mt-1 text-gray-500">There are currently no employee releaving requests to review.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {(() => {
                  const filteredEmployees = employees.filter(emp =>
                    activeTab === 'pending'
                      ? !emp.approved || emp.approved === 'pending'
                      : emp.approved === 'yes' || emp.approved === 'no'
                  );
                  return (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department & Role
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dates
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEmployees.map((emp, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {emp.fullname ? emp.fullname.charAt(0).toUpperCase() : emp.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {emp.fullname || "Unknown"}
                                  </div>
                                  <div className="text-sm text-gray-500">{emp.email}</div>
                                  <button 
                                    onClick={() => openViewModal(emp)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                                  >
                                    View Details →
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{emp.department || "-"}</div>
                              <div className="text-sm text-gray-500">{emp.designation || "-"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <div>
                                <span className="font-medium text-gray-800">Applied:</span>{" "}
                                {formatDate(emp.applied_at)}
                              </div>
                              <div>
                                <span className="font-medium text-gray-800">Resigned:</span>{" "}
                                {emp.offboarded_datetime ? formatDate(emp.offboarded_datetime) : "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                emp.approved === 'yes' 
                                  ? 'bg-green-100 text-green-800'
                                  : emp.approved === 'no'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {emp.approved === 'yes' ? 'Approved' : emp.approved === 'no' ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                            {/* Show description column only for reviewed tab */}
                            {activeTab === 'reviewed' && (
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {emp.description ? emp.description : '-'}
                              </td>
                            )}
                            {(!emp.approved || emp.approved === 'pending') && (
                              <td className="px-6 py-4">
                                <div className="max-w-xs">
                                  <input
                                    type="text"
                                    value={description[emp.email] || ""}
                                    onChange={(e) =>
                                      setDescription((prev) => ({
                                        ...prev,
                                        [emp.email]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                    placeholder="Enter reason for approval/rejection..."
                                    disabled={activeTab === 'reviewed'}
                                  />
                                  {!description[emp.email]?.trim() && activeTab === 'pending' && (
                                    <p className="mt-1 text-xs text-orange-600">
                                      Description required for action
                                    </p>
                                  )}
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openConfirmationModal(emp, 'approve')}
                                  disabled={loading || !description[emp.email]?.trim() || activeTab === 'reviewed'}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Approve
                                </button>
                                <button
                                  onClick={() => openConfirmationModal(emp, 'reject')}
                                  disabled={loading || !description[emp.email]?.trim() || activeTab === 'reviewed'}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Employee Details Modal */}
        {modal.isOpen && modal.type === 'view' && modal.employee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full transform transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {modal.employee.fullname ? modal.employee.fullname.charAt(0).toUpperCase() : modal.employee.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {modal.employee.fullname || "Unknown"}
                      </h3>
                      <p className="text-gray-500">{modal.employee.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-sm text-gray-900 mt-1">{modal.employee.department || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Designation</label>
                      <p className="text-sm text-gray-900 mt-1">{modal.employee.designation || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <p className="text-sm text-gray-900 mt-1">{modal.employee.role || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900 mt-1">{modal.employee.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Work Location</label>
                      <p className="text-sm text-gray-900 mt-1">{modal.employee.work_location || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date Joined</label>
                      <p className="text-sm text-gray-900 mt-1">{formatDate(modal.employee.date_joined)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Applied Date</label>
                      <p className="text-sm text-gray-900 mt-1">{formatDate(modal.employee.applied_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Relieved Date</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {modal.employee.offboarded_datetime ? formatDate(modal.employee.offboarded_datetime) : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {(modal.employee.reason_for_resignation || modal.employee.description) && (
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-500">Releaving Reason</label>
                    <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                      {modal.employee.reason_for_resignation || modal.employee.description}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {modal.isOpen && (modal.type === 'approve' || modal.type === 'reject') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all">
              <div className="p-6">
                <div className={`flex items-center justify-center h-12 w-12 rounded-full mx-auto ${
                  modal.type === 'approve' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {modal.type === 'approve' ? (
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {modal.type === 'approve' ? 'Approve Releaving' : 'Reject Releaving'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {modal.message}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                    modal.type === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {modal.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Modal */}
        {modal.isOpen && (modal.type === 'success' || modal.type === 'error') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all">
              <div className="p-6">
                <div className={`flex items-center justify-center h-12 w-12 rounded-full mx-auto ${
                  modal.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {modal.type === 'success' ? (
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {modal.type === 'success' ? 'Success!' : 'Error!'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {modal.message}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end">
                <button
                  onClick={closeModal}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                    modal.type === 'success' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    </>
  );
};

export default ReleavedList;