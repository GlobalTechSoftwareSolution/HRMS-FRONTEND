"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Image from "next/image";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type Leave = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  daysRequested: number;
  submittedDate: string;
  profilePic?: string;
};

// Raw API response (before mapping into Leave)
type LeaveApiResponseItem = {
  id?: number;
  employeeId?: string;
  name?: string;
  email?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
  status?: LeaveStatus;
  daysRequested?: number;
  submittedDate?: string;
  start_date?: string;
  end_date?: string;
  submitted_date?: string;
};

type EmployeeMap = {
  name: string;
  pic: string;
  phone?: string;
  mobile?: string;
  department?: string;
  designation?: string;
  reports_to?: string;
  skills?: string;
  date_joined?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  residential_address?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  personal_email?: string;
  linkedin_profile?: string;
  pan_number?: string;
  aadhar_number?: string;
  bank_account?: string;
  bank_ifsc?: string;
  date_of_birth?: string;
  blood_group?: string;
  work_location?: string;
};

export default function HRLeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<string, EmployeeMap>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | LeaveStatus>("All");
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Helper function to calculate days between start and end date
  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // include start & end
    return diffDays > 0 ? diffDays : 1; // fallback to 1 if dates are same or invalid
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
        const data = await res.json();
        const employeesArray = Array.isArray(data) ? data : (data?.employees || data?.data || []);
        const map: Record<
          string,
          {
            name: string;
            pic: string;
            phone?: string;
            department?: string;
            designation?: string;
            reports_to?: string;
            skills?: string;
            date_joined?: string;
            gender?: string;
            marital_status?: string;
            nationality?: string;
            residential_address?: string;
            permanent_address?: string;
            emergency_contact_name?: string;
            emergency_contact_phone?: string;
          }
        > = {};
        employeesArray.forEach((emp: {
          email?: string;
          fullname?: string;
          profile_picture?: string;
          phone?: string;
          department?: string;
          designation?: string;
          reports_to?: string;
          skills?: string;
          date_joined?: string;
          gender?: string;
          marital_status?: string;
          nationality?: string;
          residential_address?: string;
          permanent_address?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
        }) => {
          if (emp.email) {
            map[emp.email] = {
              name: emp.fullname || emp.email.split("@")[0],
              pic: emp.profile_picture || "",
              phone: emp.phone,
              department: emp.department,
              designation: emp.designation,
              reports_to: emp.reports_to,
              skills: emp.skills,
              date_joined: emp.date_joined,
              gender: emp.gender,
              marital_status: emp.marital_status,
              nationality: emp.nationality,
              residential_address: emp.residential_address,
              permanent_address: emp.permanent_address,
              emergency_contact_name: emp.emergency_contact_name,
              emergency_contact_phone: emp.emergency_contact_phone,
            };
          }
        });
        setEmployeeMap(map);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();

    const fetchLeaves = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`
        );
        const data = await res.json();

        const mappedLeaves: Leave[] = (data.leaves ?? []).map(
          (item: LeaveApiResponseItem, index: number) => {
            const start = item.startDate ?? item.start_date ?? "";
            const end = item.endDate ?? item.end_date ?? "";
            return {
              id: item.id ?? index + 1,
              employeeId: item.employeeId ?? item.email ?? "",
              name: item.name ?? (item.email ? item.email.split("@")[0] : ""),
              email: item.email ?? "",
              reason: item.reason ?? "",
              startDate: start,
              endDate: end,
              status: item.status ?? "Pending",
              daysRequested: calculateDays(start, end), // calculate days dynamically
              submittedDate:
                item.submittedDate ?? item.submitted_date ?? start ?? "",
            };
          }
        );

        mappedLeaves.forEach((l) => {
          if (employeeMap[l.email]) {
            l.name = employeeMap[l.email].name;
            l.profilePic = employeeMap[l.email].pic;
          }
        });

        setLeaves(mappedLeaves);
      } catch (err) {
        console.error("Error fetching leaves:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, [employeeMap]);

  const filteredLeaves =
    filter === "All" ? leaves : leaves.filter((l) => l.status === filter);

  // Pagination logic
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeaves = filteredLeaves.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <DashboardLayout role="hr">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 overflow-x-hidden w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 w-full">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Employee Leave Requests
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage and review leave requests from employees
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-5 w-full md:w-auto">
            {["All", "Pending", "Approved", "Rejected"].map((tab) => {
              const count = tab === "All" 
                ? leaves.length 
                : leaves.filter(l => l.status === tab).length;
              return (
                <button
                  key={tab}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 flex items-center gap-2 ${
                    filter === tab
                      ? "bg-blue-600 text-white shadow-md transform scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setFilter(tab as "All" | LeaveStatus)}
                >
                  {tab}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === tab 
                      ? "bg-white text-blue-600" 
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700">
              No {filter.toLowerCase()} leaves found
            </h3>
            <p className="mt-1 text-gray-500">
              There are currently no {filter.toLowerCase()} leave requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {leave.profilePic && (
                          <Image
                            src={leave.profilePic}
                            alt={leave.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{leave.name}</div>
                          <div className="text-sm text-gray-500">{leave.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{leave.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{leave.startDate}</div>
                      <div className="text-sm text-gray-500">{leave.endDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{leave.daysRequested}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leave.status === "Approved" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      )}
                      {leave.status === "Rejected" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                      {leave.status === "Pending" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLeave(leave)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      {leave.status === "Pending" && (
                        <>
                          <button
                            onClick={() => {
                              setLeaves(prev => prev.map(l => 
                                l.id === leave.id ? {...l, status: "Approved"} : l
                              ));
                            }}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setLeaves(prev => prev.map(l => 
                                l.id === leave.id ? {...l, status: "Rejected"} : l
                              ));
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredLeaves.length)} of {filteredLeaves.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredLeaves.length)} of {filteredLeaves.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-6xl relative animate-scaleIn max-h-[90vh] overflow-y-auto space-y-6">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                onClick={() => setSelectedLeave(null)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              
              <div className="text-center border-b pb-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Leave Request Details</h3>
              </div>
              
              <div className="space-y-6">
                {/* Employee Details */}
                <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                  <h5 className="font-semibold text-gray-800 mb-4 text-xl flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 011 8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Employee Information
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Employee ID:</span>
                      <p className="text-gray-900 font-medium break-all">{selectedLeave.employeeId}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Name:</span>
                      <p className="text-gray-900 font-medium break-all">{selectedLeave.name}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-medium text-gray-700 text-sm">Email:</span>
                      <p className="text-gray-900 font-medium break-all">{selectedLeave.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Phone:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Mobile:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Department:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Designation:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.designation || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Reports To:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.reports_to || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Manager Email:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.reports_to || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Skills:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.skills || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Date Joined:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.date_joined || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Work Location:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Gender:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Marital Status:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.marital_status || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Nationality:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.nationality || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Date of Birth:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.date_of_birth || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Blood Group:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.blood_group || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-medium text-gray-700 text-sm">Residential Address:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.residential_address || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-medium text-gray-700 text-sm">Permanent Address:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.permanent_address || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Emergency Contact Name:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.emergency_contact_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Emergency Contact Phone:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.emergency_contact_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Emergency Contact Relation:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.emergency_contact_relation || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Personal Email:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.personal_email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">LinkedIn Profile:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.linkedin_profile || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">PAN Number:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.pan_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Aadhar Number:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.aadhar_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Bank Account:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.bank_account || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Bank IFSC:</span>
                      <p className="text-gray-900 font-medium break-all">{employeeMap[selectedLeave.email]?.bank_ifsc || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Leave Details */}
                <div className="bg-blue-50 p-6 rounded-xl space-y-4">
                  <h5 className="font-semibold text-gray-800 mb-4 text-xl flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 0V3m0 4h.01M12 21l-4-4m4 4l-4-4M3 3h18M3 7h18" />
                    </svg>
                    Leave Information
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Reason:</span>
                      <p className="text-gray-900 font-medium bg-white p-3 rounded-lg">{selectedLeave.reason}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Start Date:</span>
                      <p className="text-gray-900 font-medium">{selectedLeave.startDate}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">End Date:</span>
                      <p className="text-gray-900 font-medium">{selectedLeave.endDate}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Days Requested:</span>
                      <p className="text-gray-900 font-medium text-lg">{selectedLeave.daysRequested}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Submitted Date:</span>
                      <p className="text-gray-900 font-medium">{selectedLeave.submittedDate}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Status:</span>
                      <div className="mt-2">
                        {selectedLeave.status === "Approved" && (
                          <span className="inline-flex items-center space-x-2 text-green-700 bg-green-100 px-4 py-2 rounded-full text-sm font-medium">
                            <CheckCircle className="h-5 w-5" />
                            <span>Approved</span>
                          </span>
                        )}
                        {selectedLeave.status === "Rejected" && (
                          <span className="inline-flex items-center space-x-2 text-red-700 bg-red-100 px-4 py-2 rounded-full text-sm font-medium">
                            <XCircle className="h-5 w-5" />
                            <span>Rejected</span>
                          </span>
                        )}
                        {selectedLeave.status === "Pending" && (
                          <span className="inline-flex items-center space-x-2 text-yellow-700 bg-yellow-100 px-4 py-2 rounded-full text-sm font-medium">
                            <Clock className="h-5 w-5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
