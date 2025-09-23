"use client";

import React, { useState, useEffect } from "react";
import { nhost } from "@/app/lib/nhost"; // your Nhost client
import { useSession } from "next-auth/react";
import {
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiBarChart2,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import DashboardLayout from "@/components/DashboardLayout";

// ------------------ Types ------------------
interface Project {
  id: number;
  name: string;
  description: string;
  status: "Completed" | "Pending" | "In Progress";
  start_date: string | null;
  end_date: string | null;
  team?: string[];
}

// For new projects (no id yet)
type NewProject = Omit<Project, "id">;

const ProjectsDashboard: React.FC = () => {
  const { data: session } = useSession();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Completed" | "Pending" | "In Progress"
  >("All");

  const [newProject, setNewProject] = useState<NewProject>({
    name: "",
    description: "",
    status: "Pending",
    start_date: "",
    end_date: "",
    team: [],
  });

  const [teamMember, setTeamMember] = useState("");

  // ------------------ Fetch Projects ------------------
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_projects/`
        );

        if (!res.ok) {
          console.error("Failed to fetch projects, status:", res.status);
          setProjects([]);
          return;
        }

        const data = await res.json();
        console.log("Fetched projects data:", data);

        if (Array.isArray(data)) {
          setProjects(data);
        } else if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
        } else {
          console.warn("Unexpected API response shape:", data);
          setProjects([]);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // ------------------ Team Helpers ------------------
  const addTeamMember = () => {
    if (!teamMember.trim()) return;
    setNewProject({ ...newProject, team: [...(newProject.team || []), teamMember] });
    setTeamMember("");
  };

  const removeTeamMember = (member: string) => {
    setNewProject({
      ...newProject,
      team: (newProject.team || []).filter((m) => m !== member),
    });
  };

  // ------------------ Filtered Projects ------------------
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      (project.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      statusFilter === "All" || project.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  // ------------------ CRUD ------------------
  const handleAddProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      // Always include CEO email
      const ownerEmail = session?.user?.email || "ceo@example.com";

      const body = {
        ...newProject,
        owner_email: ownerEmail, // REQUIRED
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_project/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Add project failed:", res.status, text);
        throw new Error(`Failed to add project: ${res.status}`);
      }

      const data = await res.json();
      setProjects([...projects, data]);
      resetForm();
      setIsModalOpen(false);
      alert(`📢 New project "${newProject.name}" added!`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add project");
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/update_project/${selectedProject.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProject),
        }
      );

      if (!res.ok) throw new Error("Failed to update project");

      const data: Project = await res.json();
      setProjects(
        projects.map((p) => (p.id === selectedProject.id ? data : p))
      );
      resetForm();
      setIsModalOpen(false);
      setSelectedProject(null);
      setIsEditMode(false);
      alert(`✅ Project "${newProject.name}" updated!`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update project");
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/delete_project/${selectedProject.id}/`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete project");

      setProjects(projects.filter((p) => p.id !== selectedProject.id));
      setIsDeleteModalOpen(false);
      setSelectedProject(null);
      alert(`🗑️ Project "${selectedProject.name}" deleted!`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete project");
    }
  };

  const resetForm = () => {
    setNewProject({
      name: "",
      description: "",
      status: "Pending",
      start_date: "",
      end_date: "",
      team: [],
    });
    setTeamMember("");
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setNewProject({
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      team: project.team || [],
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "Completed":
        return <FiCheckCircle className="text-green-500" />;
      case "Pending":
        return <FiClock className="text-yellow-500" />;
      case "In Progress":
        return <FiLoader className="text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  // ------------------ UI ------------------
  return (
    <DashboardLayout role="ceo">
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Projects Dashboard
            </h1>
            <p className="text-gray-600">
              Manage and track all company projects
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsEditMode(false);
              setSelectedProject(null);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            <FiPlus className="mr-2" /> Add New Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <FiBarChart2 size={20} />
              </div>
              <div>
                <h3 className="text-sm text-gray-600">Total Projects</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
                <FiCheckCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm text-gray-600">Completed</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {projects.filter((p) => p.status === "Completed").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 mr-4">
                <FiLoader size={20} className="animate-spin" />
              </div>
              <div>
                <h3 className="text-sm text-gray-600">In Progress</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {projects.filter((p) => p.status === "In Progress").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as Project["status"] | "All")
                }
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6">
                    No projects found
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      {project.name}
                      <div className="text-xs text-gray-500">
                        {project.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-1">
                      {getStatusIcon(project.status)} {project.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(project)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => openDeleteModal(project)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  {isEditMode ? "Edit Project" : "Add New Project"}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      placeholder="Enter project name"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Enter project description"
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={newProject.start_date || ""}
                        onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={newProject.end_date || ""}
                        onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({...newProject, status: e.target.value as Project["status"]})}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Members</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={teamMember}
                        onChange={(e) => setTeamMember(e.target.value)}
                        placeholder="Enter team member name"
                        className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button
                        onClick={addTeamMember}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Add
                      </button>
                    </div>
                <div className="flex flex-wrap gap-2">
  {newProject.team?.map((member, index) => (
    <span
      key={index}
      className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
    >
      {member}
      <button
        onClick={() => removeTeamMember(member)}
        className="text-blue-900 hover:text-blue-700"
      >
        <FiX size={14} />
      </button>
    </span>
  ))}
</div>

                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={isEditMode ? handleUpdateProject : handleAddProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                >
                  {isEditMode ? "Update Project" : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiAlertCircle className="text-red-500" />
                  Confirm Deletion
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600">
                  Are you sure you want to delete the project <strong>{selectedProject?.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="p-6 border-t flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectsDashboard;
