"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Image from "next/image";

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

export default function HRLeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employeeMap, setEmployeeMap] = useState<
    Record<
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
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | LeaveStatus>("All");
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

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
        const res = await fetch(`https://globaltechsoftwaresolutions.cloud/api/accounts/employees/`);
        const data = await res.json();
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
        (data || []).forEach((emp: {
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading leave requests...</span>
      </div>
    );

  const filteredLeaves =
    filter === "All" ? leaves : leaves.filter((l) => l.status === filter);

  return (
    <DashboardLayout role="hr">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Employee Leave Requests
          </h2>
          <div className="flex flex-wrap gap-5">
            {["All", "Pending", "Approved", "Rejected"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === tab
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilter(tab as "All" | LeaveStatus)}
              >
                {tab}
              </button>
            ))}
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
          <>
            {/* Table for larger screens */}
            <div className="hidden sm:block overflow-x-auto rounded-xl shadow-md border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-600 uppercase">
                    <th className="p-4 font-medium">Employee ID</th>
                    <th className="p-4 font-medium">Reason</th>
                    <th className="p-4 font-medium">Period</th>
                    <th className="p-4 font-medium">Days</th>
                    <th className="p-4 font-medium">Submitted</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => setSelectedLeave(leave)}
                    >
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-3">
                          {leave.profilePic ? (
                            <Image
                              src={leave.profilePic}
                              alt={leave.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                              {leave.name?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{leave.name || "Unknown"}</span>
                            <span className="text-sm text-gray-500">{leave.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 max-w-xs truncate">{leave.reason}</td>
                      <td className="p-4">
                        {new Date(leave.startDate).toLocaleDateString("en-GB")} → {new Date(leave.endDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-4 text-center">
                        {calculateDays(leave.startDate, leave.endDate)}
                      </td>
                      <td className="p-4">{new Date(leave.submittedDate).toLocaleDateString("en-GB")}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            leave.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : leave.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards for small screens */}
            <div className="sm:hidden mt-4 space-y-4">
              {filteredLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white shadow-md rounded-lg p-4 space-y-2 border border-gray-100 hover:shadow-lg transition-shadow duration-200"
                  onClick={() => setSelectedLeave(leave)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {leave.profilePic ? (
                        <Image
                          src={leave.profilePic}
                          alt={leave.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                          {leave.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">{leave.name || "Unknown"}</h3>
                        <p className="text-xs text-gray-500">{leave.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        leave.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : leave.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">{leave.reason}</p>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {new Date(leave.startDate).toLocaleDateString("en-GB")} →{" "}
                      {new Date(leave.endDate).toLocaleDateString("en-GB")}
                    </span>
                    <span>{calculateDays(leave.startDate, leave.endDate)} days</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative animate-scaleIn max-h-[80vh] overflow-y-auto space-y-4">
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

              <div className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-blue-700">Leave Request Details</h3>
                <p className="text-gray-500 text-sm mt-1">ID: {selectedLeave.id}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Employee ID</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800 truncate max-w-[200px]" title={selectedLeave.employeeId}>
                      {selectedLeave.employeeId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Name</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{selectedLeave.name || "Unknown"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Email</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{selectedLeave.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Phone</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Department</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Designation</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.designation || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Skills</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.skills || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Date Joined</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">
                      {employeeMap[selectedLeave.email]?.date_joined
                        ? new Date(employeeMap[selectedLeave.email]?.date_joined ?? "").toLocaleDateString("en-GB")
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <hr className="border-gray-200 my-2" />

                {/* Enhanced Employee Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Gender</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.gender || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Marital Status</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.marital_status || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Nationality</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.nationality || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 leading-snug">Reporting Manager</p>
                    <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.reports_to || "N/A"}</p>
                  </div>
                </div>

                <hr className="border-gray-200 my-2" />

                <div>
                  <p className="text-sm text-gray-500 leading-snug">Residential Address</p>
                  <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.residential_address || "N/A"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 leading-snug">Permanent Address</p>
                  <p className="font-medium break-words leading-relaxed text-gray-800">{employeeMap[selectedLeave.email]?.permanent_address || "N/A"}</p>
                </div>

                <hr className="border-gray-200 my-2" />

                <div>
                  <p className="text-sm text-gray-500 leading-snug">Emergency Contact</p>
                  <p className="font-medium break-words leading-relaxed text-gray-800">
                    {employeeMap[selectedLeave.email]?.emergency_contact_name
                      ? `${employeeMap[selectedLeave.email]?.emergency_contact_name} (${employeeMap[selectedLeave.email]?.emergency_contact_phone || "N/A"})`
                      : "N/A"}
                  </p>
                </div>

                <hr className="border-gray-200 my-2" />

                <div>
                  <p className="text-sm text-gray-500 leading-snug">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedLeave.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : selectedLeave.status === "Rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedLeave.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
}
