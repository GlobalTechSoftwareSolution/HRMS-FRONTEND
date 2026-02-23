"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiSearch, FiChevronDown, FiChevronUp, FiEye, FiEdit, FiX, FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';

type Employee = {
  id: number;
  email: string;
  fullname: string;
  age: number | null;
  phone: string | null;
  department: string | null;
  designation: string | null;
  date_of_birth: string | null;
  date_joined: string | null;
  skills: string | null;
  profile_picture: string | null;
  reports_to: string | null;
  status: 'active' | 'pending';
};

type User = {
  id: number;
  email: string;
  fullname: string;
  is_staff: boolean;
  user_type: string;
  role?: string; // Add optional role field for compatibility
};

type SortConfig = {
  key: keyof Employee;
  direction: 'ascending' | 'descending';
};

type TabType = 'all' | 'pending';

type ApiUser = {
  id: number;
  email: string;
  fullname: string;
  is_staff: boolean;
  user_type?: string;
  role?: string;
};

const ProfileAvatar = ({
  src,
  alt,
  name,
  email,
  className
}: {
  src: string | null;
  alt: string;
  name: string | null;
  email: string;
  className?: string;
}) => {
  const [imgError, setImgError] = useState(false);

  // If we have a valid source and there's no error rendering it
  if (src && src.trim() !== '' && !imgError && !src.includes('placeholder.png') && !src.includes('default-profile.png') && !src.includes('default-avatar.png')) {
    const profileSrc = src.startsWith('/') || src.startsWith('http') ? src : '/' + src;
    return (
      <Image
        src={profileSrc}
        alt={alt}
        fill
        className={`object-cover ${className || ''}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback to Initials
  return (
    <div className={`flex w-full h-full items-center justify-center font-bold bg-blue-100 text-blue-600 ${className || ''}`}>
      {(name && name.charAt(0)?.toUpperCase()) || (email && email.charAt(0)?.toUpperCase()) || '?'}
    </div>
  );
};


export default function Onboarding() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch active employees
      const empRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`);
      if (!empRes.ok) throw new Error(`Employee fetch error! status: ${empRes.status}`);
      const empDataRaw = await empRes.json();
      const empData = Array.isArray(empDataRaw) ? empDataRaw : (empDataRaw?.employees || empDataRaw?.data || []);

      // Fetch users for pending employees
      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/users/`);
      if (!userRes.ok) throw new Error(`User fetch error! status: ${userRes.status}`);
      const userData = await userRes.json();

      // Handle different response formats
      const userArray = Array.isArray(userData) ? userData : (userData?.users || userData?.data || []);

      // Filter pending users (employees with is_staff=false)
      const pending = userArray.filter((user: ApiUser) => {
        const role = user.user_type || user.role;
        return role === 'employee' && !user.is_staff;
      }).map((user: ApiUser) => ({
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        is_staff: user.is_staff,
        user_type: user.user_type || 'employee',
        role: user.role
      }));

      setEmployees(empData || []);
      setPendingUsers(pending || []);
      setError("");
    } catch (err: unknown) {
      console.error("Failed to fetch data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch employee data";
      setError(`Failed to fetch employee data. Please check console for details. Error: ${errorMessage}`);
      toast.error("Failed to fetch employee data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // State for onboarding modal and form
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardFormData, setOnboardFormData] = useState({
    email: "",
    password: "",
    role: "employee",
  });
  const [isSubmittingOnboard, setIsSubmittingOnboard] = useState(false);

  // Handle onboard new employee (open modal)
  const handleOnboardEmployee = () => {
    setIsOnboarding(true);
    setOnboardFormData({
      email: "",
      password: "",
      role: "employee",
    });
  };

  // Modal input change handler
  const handleOnboardInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOnboardFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit new employee form
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOnboard(true);
    try {
      // Prepare payload
      const payload = {
        email: onboardFormData.email,
        password: onboardFormData.password,
        role: onboardFormData.role,
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/signup/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to onboard employee");
      }
      setIsOnboarding(false);
      toast.success("Employee onboarded successfully!");
      // Refresh employees and pending users
      await fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to onboard employee";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingOnboard(false);
    }
  };

  // Handle approve pending employee
  const handleApproveEmployee = async (user: User) => {
    try {
      // Update user to is_staff=true
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/users/${user.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_staff: true }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Remove from pending users and refresh data
      setPendingUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success(`${user.fullname} has been approved as an employee`);

      // Refresh employee list
      await fetchData();
    } catch (err: unknown) {
      console.error("Failed to approve employee:", err);
      toast.error("Failed to approve employee");
    }
  };

  // Handle edit employee - populate form with existing data
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    // Pre-populate form with existing employee data
    setEditFormData({
      fullname: employee.fullname,
      age: employee.age,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      date_of_birth: employee.date_of_birth,
      date_joined: employee.date_joined,
      skills: employee.skills,
      reports_to: employee.reports_to,
    });
    setIsEditing(true);
    setProfilePictureFile(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value === "" ? null : value
    }));
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePictureFile(e.target.files[0]);
    }
  };

  // Save edited employee data
  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    try {
      const formData = new FormData();

      // always include PK
      formData.append("email", selectedEmployee.email);

      // append editable fields
      formData.append("fullname", editFormData.fullname ?? selectedEmployee.fullname ?? "");
      formData.append("phone", editFormData.phone ?? selectedEmployee.phone ?? "");
      formData.append("department", editFormData.department ?? selectedEmployee.department ?? "");
      formData.append("designation", editFormData.designation ?? selectedEmployee.designation ?? "");
      formData.append("date_of_birth", editFormData.date_of_birth ?? selectedEmployee.date_of_birth ?? "");
      formData.append("date_joined", editFormData.date_joined ?? selectedEmployee.date_joined ?? "");
      formData.append("skills", editFormData.skills ?? selectedEmployee.skills ?? "");
      formData.append("reports_to", editFormData.reports_to ?? selectedEmployee.reports_to ?? "");

      // ✅ handle file upload
      if (profilePictureFile) {
        formData.append("profile_picture", profilePictureFile); // must match backend field
      } else if (selectedEmployee.profile_picture) {
        // if no new file chosen, send old URL/path
        formData.append("profile_picture", selectedEmployee.profile_picture);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${selectedEmployee.email}/`,
        {
          method: "PUT", // or PATCH if backend prefers partial update
          body: formData,
          // ❌ don’t set Content-Type, browser will set it with boundary
        }
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const updatedEmployee: Employee = await res.json();

      setEmployees(prev =>
        prev.map(emp => (emp.email === selectedEmployee.email ? updatedEmployee : emp))
      );

      toast.success("Employee updated successfully");
      setIsEditing(false);
      setSelectedEmployee(null);
      setEditFormData({});
      setProfilePictureFile(null);
    } catch (err: unknown) {
      console.error("Failed to update employee:", err);
      toast.error("Failed to update employee");
    }
  };


  // Get unique departments for filter
  const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean))) as string[];

  // Filter employees/users based on tab selection
  const filteredData = useMemo(() => {
    if (activeTab === 'pending') {
      // Return pending users for pending tab
      return pendingUsers.filter(user => {
        const matchesSearch =
          (user.fullname?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
    } else {
      // Return all employees for all tab
      return employees.filter(employee => {
        const matchesSearch = employee.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (employee.designation && employee.designation.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;

        return matchesSearch && matchesDepartment;
      });
    }
  }, [employees, pendingUsers, searchTerm, filterDepartment, activeTab]);

  // Sort data
  const filteredAndSortedData = useMemo(() => {
    const sorted = [...filteredData];

    if (sortConfig && activeTab === 'all') {
      sorted.sort((a: Employee | User, b: Employee | User) => {
        const aValue = a[sortConfig.key as keyof (Employee | User)];
        const bValue = b[sortConfig.key as keyof (Employee | User)];

        if (aValue == null || bValue == null) return 0;

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sorted;
  }, [filteredData, sortConfig, activeTab]);

  const requestSort = (key: keyof Employee) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Pagination logic
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, activeTab]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Mobile Card View for Employees
  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <div
      className="bg-white p-4 rounded-lg shadow-sm border mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleViewDetails(employee)}
    >
      <div className="flex items-center mb-3">
        <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden mr-3">
          <div className="relative h-12 w-12">
            <ProfileAvatar
              src={employee.profile_picture}
              alt={employee.fullname || employee.email}
              name={employee.fullname}
              email={employee.email}
              className="rounded-full"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-gray-900 truncate">{employee.fullname}</h3>
          <p className="text-xs text-gray-500 truncate">{employee.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-gray-500">Designation</p>
          <p className="text-gray-900">{employee.designation || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Department</p>
          <p className="text-gray-900">{employee.department || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Join Date</p>
          <p className="text-gray-900">{formatDate(employee.date_joined)}</p>
        </div>
      </div>

      <div className="flex justify-between pt-2 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(employee);
          }}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
        >
          <FiEye className="mr-1" /> View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditEmployee(employee);
          }}
          className="text-green-600 hover:text-green-800 text-sm flex items-center"
        >
          <FiEdit className="mr-1" /> Edit
        </button>
      </div>
    </div>
  );

  // Mobile Card View for Pending Users
  const PendingUserCard = ({ user }: { user: User }) => (
    <div
      className="bg-white p-4 rounded-lg shadow-sm border mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        const employeeData = employees.find(emp => emp.email === user.email) || {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          age: null,
          phone: null,
          department: null,
          designation: null,
          date_of_birth: null,
          date_joined: null,
          skills: null,
          profile_picture: null,
          reports_to: null,
          status: 'pending'
        };
        handleViewDetails(employeeData);
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold overflow-hidden mr-3">
            {(user.fullname && user.fullname.charAt(0)) ||
              (user.email && user.email.charAt(0))}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">{user.fullname}</h3>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      </div>

      <div className="flex justify-between pt-2 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const employeeData = employees.find(emp => emp.email === user.email) || {
              id: user.id,
              email: user.email,
              fullname: user.fullname,
              age: null,
              phone: null,
              department: null,
              designation: null,
              date_of_birth: null,
              date_joined: null,
              skills: null,
              profile_picture: null,
              reports_to: null,
              status: 'pending'
            };
            handleViewDetails(employeeData);
          }}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
        >
          <FiEye className="mr-1" /> View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleApproveEmployee(user);
          }}
          className="text-green-600 hover:text-green-800 text-sm flex items-center"
        >
          <FiCheck className="mr-1" /> Approve
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        * {
          max-width: 100%;
        }
        
        @media (max-width: 640px) {
          .max-w-7xl {
            padding: 0.5rem;
          }
          .p-6 {
            padding: 1rem;
          }
          .text-2xl {
            font-size: 1.5rem;
          }
          .grid-cols-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <DashboardLayout role="hr">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-3 sm:p-4 md:p-6 overflow-x-hidden w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-5 w-full">
            <h2 className="text-2xl sm:text-3xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Employee Management</h2>
            <button
              onClick={handleOnboardEmployee}
              className="bg-slate-800 hover:bg-slate-700 hover:-translate-y-0.5 shadow-sm text-white px-5 sm:px-6 py-2.5 rounded-xl font-semibold transition-all w-full sm:w-auto"
            >
              Onboard New Employee
            </button>
          </div>

          {/* Onboard New Employee Modal */}
          {isOnboarding && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
              <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden my-auto">
                <div className="flex justify-between items-center mb-4 w-full">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold break-words flex-1 mr-2">Onboard New Employee</h3>
                  <button onClick={() => setIsOnboarding(false)} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                    <FiX size={20} />
                  </button>
                </div>
                <form onSubmit={handleOnboardSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={onboardFormData.email}
                      onChange={handleOnboardInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={onboardFormData.password}
                      onChange={handleOnboardInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      name="role"
                      value={onboardFormData.role}
                      disabled
                      className="w-full px-3 py-2 border rounded-md bg-gray-100"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsOnboarding(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                      disabled={isSubmittingOnboard}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      disabled={isSubmittingOnboard}
                    >
                      {isSubmittingOnboard ? "Submitting..." : "Add Employee"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Status Tabs */}
          <div className="border-b border-slate-200 mb-8">
            <nav className="-mb-px flex space-x-10">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-bold text-sm tracking-wide transition-colors ${activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
              >
                All Employees ({employees.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-bold text-sm tracking-wide transition-colors ${activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
              >
                Pending Approval ({pendingUsers.length})
              </button>
            </nav>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'pending' ? "Search pending users..." : "Search employees..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium transition-shadow"
                />
              </div>

              {activeTab === 'all' && (
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium transition-shadow slate-700"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Employee Details/Edit Modal */}
          {selectedEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
              <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto overflow-x-hidden my-auto">
                <div className="flex justify-between items-center mb-4 w-full">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold break-words flex-1 mr-2">
                    {isEditing ? "Edit Employee" : "Employee Details"}
                  </h3>
                  <button onClick={() => {
                    setSelectedEmployee(null);
                    setEditFormData({});
                    setIsEditing(false);
                  }} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                    <FiX size={20} />
                  </button>
                </div>
                <div className="flex items-center mb-6 w-full overflow-hidden">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden">
                    {profilePictureFile ? (
                      <div className="relative h-16 w-16">
                        <Image
                          src={URL.createObjectURL(profilePictureFile)}
                          alt="Preview"
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="relative h-16 w-16">
                        <ProfileAvatar
                          src={selectedEmployee.profile_picture}
                          alt={selectedEmployee.fullname || selectedEmployee.email}
                          name={selectedEmployee.fullname}
                          email={selectedEmployee.email}
                          className="rounded-full scale-125"
                        />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 break-words">{selectedEmployee.fullname}</h4>
                    <p className="text-sm sm:text-base text-gray-500 break-all">{selectedEmployee.email}</p>
                  </div>
                </div>
                {/* Show profile picture upload only if editing and not in pending tab */}
                {isEditing && activeTab !== 'pending' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      {(isEditing && activeTab !== 'pending') ? (
                        <input
                          type="text"
                          name="fullname"
                          value={editFormData.fullname ?? ""}
                          onChange={handleInputChange}
                          placeholder={selectedEmployee.fullname || "Enter full name"}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedEmployee.fullname || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      {(isEditing && activeTab !== 'pending') ? (
                        <input
                          type="text"
                          name="designation"
                          value={editFormData.designation ?? ""}
                          onChange={handleInputChange}
                          placeholder={selectedEmployee.designation || "Enter designation"}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedEmployee.designation || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      {(isEditing && activeTab !== 'pending') ? (
                        <input
                          type="text"
                          name="department"
                          value={editFormData.department ?? ""}
                          onChange={handleInputChange}
                          placeholder={selectedEmployee.department || "Enter department"}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedEmployee.department || "N/A"}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      {(isEditing && activeTab !== 'pending') ? (
                        <input
                          type="text"
                          name="phone"
                          value={editFormData.phone ?? ""}
                          onChange={handleInputChange}
                          placeholder={selectedEmployee.phone || "Enter phone number"}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedEmployee.phone || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      {(isEditing && activeTab !== 'pending') ? (
                        <input
                          type="date"
                          name="date_of_birth"
                          value={editFormData.date_of_birth ?? ""}
                          onChange={handleInputChange}
                          placeholder={
                            selectedEmployee.date_of_birth
                              ? selectedEmployee.date_of_birth
                              : "Select date of birth"
                          }
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-gray-900">{formatDate(selectedEmployee.date_of_birth)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Joined</label>
                      {(isEditing && activeTab !== 'pending') ? (
                        <input
                          type="date"
                          name="date_joined"
                          value={editFormData.date_joined ?? ""}
                          onChange={handleInputChange}
                          placeholder={
                            selectedEmployee.date_joined
                              ? selectedEmployee.date_joined
                              : "Select date joined"
                          }
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-gray-900">{formatDate(selectedEmployee.date_joined)}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                    {(isEditing && activeTab !== 'pending') ? (
                      <input
                        type="text"
                        name="reports_to"
                        value={editFormData.reports_to ?? ""}
                        onChange={handleInputChange}
                        placeholder={selectedEmployee.reports_to || "Enter manager/supervisor"}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedEmployee.reports_to || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    {(isEditing && activeTab !== 'pending') ? (
                      <textarea
                        name="skills"
                        value={editFormData.skills ?? ""}
                        onChange={handleInputChange}
                        placeholder={selectedEmployee.skills || "Enter skills"}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-900">{selectedEmployee.skills || "N/A"}</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  {isEditing && activeTab !== 'pending' ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditFormData({});
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Only show Edit button if not in pending tab */}

                      <button
                        onClick={() => {
                          setSelectedEmployee(null);
                          setEditFormData({});
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading and Error States */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading data...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Data List - Mobile Card View */}
          {!isLoading && !error && isMobile && (
            <>
              <div className="mb-4">
                {paginatedData.map((item) => (
                  activeTab === 'all' ? (
                    <EmployeeCard key={item.email} employee={item as Employee} />
                  ) : (
                    <PendingUserCard key={item.id} user={item as User} />
                  )
                ))}
              </div>

              {filteredAndSortedData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {activeTab === 'pending'
                    ? "No pending users found matching your criteria"
                    : "No employees found matching your criteria"
                  }
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 border-t border-slate-200 pt-5">
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-blue-200'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span> of <span className="text-slate-800">{filteredAndSortedData.length}</span> {activeTab === 'pending' ? 'users' : 'employees'}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Data List - Desktop Table View */}
          {!isLoading && !error && !isMobile && (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th
                        className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => activeTab === 'all' && requestSort('fullname')}
                      >
                        <div className="flex items-center">
                          <span>{activeTab === 'pending' ? 'User' : 'Employee'}</span>
                          {sortConfig?.key === 'fullname' && activeTab === 'all' && (
                            sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                          )}
                        </div>
                      </th>
                      {activeTab === 'all' && (
                        <>
                          <th
                            className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => requestSort('designation')}
                          >
                            <div className="flex items-center">
                              <span>Designation</span>
                              {sortConfig?.key === 'designation' && (
                                sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                          <th
                            className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => requestSort('department')}
                          >
                            <div className="flex items-center">
                              <span>Department</span>
                              {sortConfig?.key === 'department' && (
                                sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                          <th
                            className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => requestSort('date_joined')}
                          >
                            <div className="flex items-center">
                              <span>Join Date</span>
                              {sortConfig?.key === 'date_joined' && (
                                sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                              )}
                            </div>
                          </th>
                        </>
                      )}
                      {activeTab === 'pending' && (
                        <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                      )}
                      <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {paginatedData.map((item) => (
                      <tr key={item.email} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 border border-blue-100 rounded-full overflow-hidden">
                              <div className="relative h-10 w-10">
                                <ProfileAvatar
                                  src={activeTab === 'all' ? (item as Employee).profile_picture : null}
                                  alt={item.fullname || item.email}
                                  name={item.fullname}
                                  email={item.email}
                                  className="rounded-full scale-110"
                                />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-slate-800">{item.fullname}</div>
                              <div className="text-xs font-medium text-slate-400">{item.email}</div>
                            </div>
                          </div>
                        </td>
                        {activeTab === 'all' && (
                          <>
                            <td className="p-4 text-sm font-medium text-slate-600">{(item as Employee).designation || "N/A"}</td>
                            <td className="p-4 text-sm font-medium text-slate-600">{(item as Employee).department || "N/A"}</td>
                            <td className="p-4 text-sm font-medium text-slate-600">{formatDate((item as Employee).date_joined)}</td>
                          </>
                        )}
                        {activeTab === 'pending' && (
                          <td className="p-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              Pending Approval
                            </span>
                          </td>
                        )}
                        <td className="p-4 text-sm font-medium">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleViewDetails(item as Employee)}
                              className="text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 hover:border-blue-200"
                            >
                              <FiEye className="mr-1.5" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredAndSortedData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {activeTab === 'pending'
                      ? "No pending users found matching your criteria"
                      : "No employees found matching your criteria"
                    }
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 border-t border-slate-200 pt-5">
                  <div className="text-sm font-medium text-slate-500">
                    Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span> of <span className="text-slate-800">{filteredAndSortedData.length}</span> {activeTab === 'pending' ? 'users' : 'employees'}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-blue-200'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
