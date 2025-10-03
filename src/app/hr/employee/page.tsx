"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { FiSearch, FiChevronDown, FiChevronUp, FiUser, FiX, FiAward, FiPlus, FiTrash2, FiFileText } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

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
  document_status?: "Submitted" | "Pending" | "Hold" | "Approved" | "Rejected" | "N/A";
};

type Award = {
  id?: number;
  employee_id: number;
  title: string;
  description: string;
  award_date: string;
  image_url: string | null;
  created_at?: string;
};

type Document = {
  id?: number;
  employee_id: number;
  title: string;
  file_url: string;
  status: "Submitted" | "Pending" | "Approved" | "Rejected";
  created_at?: string;
};

type SortConfig = {
  key: keyof Employee;
  direction: 'ascending' | 'descending';
};

export default function HREmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [showAwards, setShowAwards] = useState(false);
  const [awards, setAwards] = useState<Award[]>([]);
  const [showAddAwardForm, setShowAddAwardForm] = useState(false);
  const [newAward, setNewAward] = useState<Omit<Award, 'id' | 'employee_id' | 'created_at'>>({
    title: "",
    description: "",
    award_date: new Date().toISOString().split('T')[0],
    image_url: null
  });

  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocument, setNewDocument] = useState<Omit<Document, 'id' | 'employee_id' | 'created_at'>>({
    title: "",
    file_url: "",
    status: "Pending"
  });
  const [isUploading, setIsUploading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  // Fetch Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/api/accounts/employees/`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: Employee[] = await res.json();
        setEmployees(data);
        setError("");
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        setError("Failed to fetch employees. Please check console for details.");
        toast.error("Failed to fetch employees");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, [API_URL]);

  // Check mobile view
  useEffect(() => {
    const checkScreenSize = () => setIsMobileView(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

// Fetch document statuses
const fetchDocumentStatuses = useCallback(async () => {
  try {
    const allowedStatuses: Employee["document_status"][] = [
      "Submitted",
      "Pending",
      "Hold",
      "Approved",
      "Rejected",
    ];

    const updatedEmployees = await Promise.all(
      employees.map(async (emp) => {
        const res = await fetch(`${API_URL}/api/accounts/list_documents/?employee_id=${emp.id}`);
        if (!res.ok) return { ...emp, document_status: "N/A" as Employee["document_status"] };

        const data: Document[] = await res.json();
        const latestDoc = data.sort(
          (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
        )[0];

        // Ensure the status is one of the allowed values
        const status: Employee["document_status"] = latestDoc?.status && allowedStatuses.includes(latestDoc.status as Employee["document_status"])
          ? (latestDoc.status as Employee["document_status"])
          : "N/A";

        return { ...emp, document_status: status };
      })
    );

    setEmployees(updatedEmployees);
  } catch (err) {
    console.error("Failed to fetch document statuses:", err);
    toast.error("Failed to fetch document statuses");
  }
}, [employees, API_URL]);


  useEffect(() => {
    if (employees.length > 0) fetchDocumentStatuses();
  }, [employees, fetchDocumentStatuses]);

  // Awards
  const fetchAwards = async (employeeId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/accounts/list_awards/?employee_id=${employeeId}`);
      if (res.ok) {
        const data: Award[] = await res.json();
        setAwards(Array.isArray(data) ? data : []);
      } else {
        setAwards([]);
      } 
    } catch (err) {
      console.error("Failed to fetch awards:", err);
      toast.error("Failed to fetch awards");
      setAwards([]);
    }
  };

  const handleViewAwards = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAwards(true);
    setShowDocuments(false);
    await fetchAwards(employee.id);
  };

  const handleAddAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("employee_id", selectedEmployee.id.toString());
      formData.append("title", newAward.title);
      formData.append("description", newAward.description);
      formData.append("award_date", newAward.award_date);

      const imageInput = document.getElementById("award-image") as HTMLInputElement;
      if (imageInput?.files?.[0]) formData.append("image_url", imageInput.files[0]);

      const res = await fetch(`${API_URL}/api/accounts/create_award/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create award");

      const createdAward = await res.json();
      setAwards(prev => [...prev, createdAward]);
      setNewAward({ title: "", description: "", award_date: new Date().toISOString().split("T")[0], image_url: null });
      setShowAddAwardForm(false);
      toast.success("Award added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add award");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAward = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/accounts/delete_award/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setAwards(prev => prev.filter(a => a.id !== id));
      toast.success("Award deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete award");
    }
  };

  // Documents
  const fetchDocuments = async (employeeId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/accounts/list_documents/?employee_id=${employeeId}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      toast.error("Failed to fetch documents");
      setDocuments([]);
    }
  };

  const handleViewDocuments = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDocuments(true);
    setShowAwards(false);
    await fetchDocuments(employee.id);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      const payload = { ...newDocument, employee_id: selectedEmployee.id };
      const res = await fetch(`${API_URL}/api/accounts/create_document/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create document");
      const createdDoc = await res.json();
      setDocuments(prev => [...prev, createdDoc]);
      setNewDocument({ title: "", file_url: "", status: "Pending" });
      toast.success("Document added successfully");
    } catch (err) {
      console.error("Add document error:", err);
      toast.error("Failed to add document");
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Delete this document?")) return;
    try {
      const res = await fetch(`${API_URL}/api/accounts/delete_document/${docId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success("Document deleted successfully");
    } catch (err) {
      console.error("Delete document error:", err);
      toast.error("Failed to delete document");
    }
  };

  const handleOnboardEmployee = () => window.location.href = `${API_URL}/api/accounts/signup`;

  const formatDate = (dateString: string | null) => !dateString ? "N/A" : new Date(dateString).toLocaleDateString();

  const requestSort = (key: keyof Employee) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean))) as string[];

  const filteredAndSortedEmployees = React.useMemo(() => {
    const filtered = employees.filter(emp => {
      const matchesSearch =
        emp.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesDepartment = filterDepartment === "all" || emp.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue == null || bValue == null) return 0;
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [employees, searchTerm, filterDepartment, sortConfig]);

  // Mobile Employee Card
  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
            {employee.profile_picture ? <Image src={employee.profile_picture} alt={employee.fullname} width={40} height={40} className="rounded-full object-cover"/> : employee.fullname.charAt(0)}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{employee.fullname}</p>
            <p className="text-xs text-gray-500">{employee.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => handleViewAwards(employee)} className="text-green-600 text-xs flex items-center"><FiAward className="mr-1"/> Awards</button>
          <button onClick={() => handleViewDocuments(employee)} className="text-purple-600 text-xs flex items-center"><FiFileText className="mr-1"/> Docs</button>
        </div>
      </div>
    </div>
  );

  return (
<DashboardLayout role="hr">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Employee Management</h2>
        </div>

        <div className="bg-gray-50 p-4 rounded-md border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input type="text" placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Departments</option>
              {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
            </select>
          </div>
        </div>

        {!isLoading && !error && (
          <>
            {isMobileView ? (
              <div className="md:hidden">
                {filteredAndSortedEmployees.length ? filteredAndSortedEmployees.map(emp => <EmployeeCard key={emp.email} employee={emp} />) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiUser className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-4">No employees found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {["fullname", "designation", "department", "document_status", "date_joined"].map((col) => (
                        <th key={col} onClick={() => requestSort(col as keyof Employee)}
                          className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                          <div className="flex items-center">
                            <span>{col.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                            {sortConfig?.key === col && (sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1"/> : <FiChevronDown className="ml-1"/>)}
                          </div>
                        </th>
                      ))}
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedEmployees.map(emp => (
                      <tr key={emp.email} className="hover:bg-gray-50 transition">
                        <td className="p-3">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                              {emp.profile_picture ? (<Image src={emp.profile_picture} alt={emp.fullname} width={40} height={40} className="rounded-full object-cover"/>) : emp.fullname.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{emp.fullname}</div>
                              <div className="text-sm text-gray-500">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-700">{emp.designation || "N/A"}</td>
                        <td className="p-3 text-sm text-gray-700">{emp.department || "N/A"}</td>
                        <td className="p-3 text-sm text-gray-700">{emp.document_status || "N/A"}</td>
                        <td className="p-3 text-sm text-gray-700">{formatDate(emp.date_joined)}</td>
                        <td className="p-3 text-sm font-medium space-x-2">
                          <button onClick={() => handleViewAwards(emp)} className="text-green-600 hover:text-green-900 flex items-center">
                            <FiAward className="mr-1"/> Awards
                          </button>
                          <button onClick={() => handleViewDocuments(emp)} className="text-purple-600 hover:text-purple-900 flex items-center">
                            <FiFileText className="mr-1"/> Documents
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {isLoading && <p className="text-center py-6 text-gray-500">Loading employees...</p>}
        {error && <p className="text-center py-6 text-red-500">{error}</p>}
      </div>

      {/* Modal / Detail view */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex justify-center items-start pt-20 px-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative shadow-lg">
            <button onClick={() => { setSelectedEmployee(null); setShowAwards(false); setShowDocuments(false); }} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><FiX size={20}/></button>
            <h3 className="text-xl font-bold mb-4">{selectedEmployee.fullname} - Details</h3>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><p className="text-gray-500">Email</p><p>{selectedEmployee.email}</p></div>
              <div><p className="text-gray-500">Phone</p><p>{selectedEmployee.phone || "N/A"}</p></div>
              <div><p className="text-gray-500">Department</p><p>{selectedEmployee.department || "N/A"}</p></div>
              <div><p className="text-gray-500">Designation</p><p>{selectedEmployee.designation || "N/A"}</p></div>
              <div><p className="text-gray-500">Date of Birth</p><p>{formatDate(selectedEmployee.date_of_birth)}</p></div>
              <div><p className="text-gray-500">Date Joined</p><p>{formatDate(selectedEmployee.date_joined)}</p></div>
              <div><p className="text-gray-500">Document Status</p><p>{selectedEmployee.document_status || "N/A"}</p></div>
            </div>

            {/* Awards Section */}
            {showAwards && (
              <div>
                <h4 className="text-lg font-semibold mb-2">Awards</h4>
                {awards.length ? (
                  <div className="space-y-2">
                    {awards.map(a => (
                      <div key={a.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                        <div>
                          <p className="font-medium">{a.title}</p>
                          <p className="text-xs text-gray-500">{formatDate(a.award_date)}</p>
                        </div>
                        <button onClick={() => handleDeleteAward(a.id!)} className="text-red-600 hover:text-red-800"><FiTrash2/></button>
                      </div>
                    ))}
                  </div>
                ) : <p>No awards found</p>}
                <button onClick={() => setShowAddAwardForm(prev => !prev)} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"><FiPlus className="mr-1"/> Add Award</button>

                {showAddAwardForm && (
                  <form onSubmit={handleAddAward} className="mt-3 space-y-2">
                    <input type="text" placeholder="Title" value={newAward.title} onChange={e => setNewAward({...newAward, title: e.target.value})} className="w-full border px-2 py-1 rounded-md" required/>
                    <textarea placeholder="Description" value={newAward.description} onChange={e => setNewAward({...newAward, description: e.target.value})} className="w-full border px-2 py-1 rounded-md" required/>
                    <input type="date" value={newAward.award_date} onChange={e => setNewAward({...newAward, award_date: e.target.value})} className="w-full border px-2 py-1 rounded-md" required/>
                    <input type="file" id="award-image" accept="image/*" className="w-full border px-2 py-1 rounded-md"/>
                    <button type="submit" disabled={isUploading} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md">{isUploading ? "Uploading..." : "Add Award"}</button>
                  </form>
                )}
              </div>
            )}

            {/* Documents Section */}
            {showDocuments && (
              <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">Documents</h4>
                {documents.length ? (
                  <div className="space-y-2">
                    {documents.map(d => (
                      <div key={d.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                        <div>
                          <p className="font-medium">{d.title}</p>
                          <p className="text-xs text-gray-500">{d.status}</p>
                        </div>
                        <button onClick={() => handleDeleteDocument(d.id!)} className="text-red-600 hover:text-red-800"><FiTrash2/></button>
                      </div>
                    ))}
                  </div>
                ) : <p>No documents found</p>}
                <form onSubmit={handleAddDocument} className="mt-2 space-y-2">
                  <input type="text" placeholder="Document Title" value={newDocument.title} onChange={e => setNewDocument({...newDocument, title: e.target.value})} className="w-full border px-2 py-1 rounded-md" required/>
                  <input type="text" placeholder="File URL" value={newDocument.file_url} onChange={e => setNewDocument({...newDocument, file_url: e.target.value})} className="w-full border px-2 py-1 rounded-md" required/>
                  <select value={newDocument.status} onChange={e => setNewDocument({...newDocument, status: e.target.value as Document['status']})} className="w-full border px-2 py-1 rounded-md">
                    <option value="Pending">Pending</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md">Add Document</button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
