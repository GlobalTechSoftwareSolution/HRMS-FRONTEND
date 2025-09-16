"use client";

import React, { useState, useEffect } from "react";
import { 
  FiPlus, 
  FiCheckCircle, 
  FiClock, 
  FiLoader, 
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiX,
  FiAlertCircle,
  FiUser,
  FiCalendar,
  FiBarChart2
} from "react-icons/fi";
import DashboardLayout from "@/components/DashboardLayout";

interface Project {
  id: number;
  name: string;
  status: "Completed" | "Pending" | "In Progress";
  progress: number;
  team: string[];
  startDate: string;
  endDate: string;
  description: string;
}

const ProjectsDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([
    { 
      id: 1, 
      name: "Website Redesign", 
      status: "In Progress", 
      progress: 65,
      team: ["Sarah Johnson", "Michael Chen", "Emily Rodriguez"],
      startDate: "2023-09-10",
      endDate: "2023-12-15",
      description: "Complete redesign of company website with modern UI/UX"
    },
    { 
      id: 2, 
      name: "Mobile App Launch", 
      status: "Completed", 
      progress: 100,
      team: ["David Kim", "Jessica Williams", "Robert Garcia"],
      startDate: "2023-06-01",
      endDate: "2023-10-30",
      description: "Development and launch of new mobile application"
    },
    { 
      id: 3, 
      name: "Cloud Migration", 
      status: "Pending", 
      progress: 0,
      team: ["Thomas Miller", "Jennifer Lopez", "Christopher Brown"],
      startDate: "2023-11-01",
      endDate: "2024-02-28",
      description: "Migration of company infrastructure to cloud services"
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Completed" | "Pending" | "In Progress">("All");
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "Pending" as "Completed" | "Pending" | "In Progress",
    startDate: "",
    endDate: "",
    team: [] as string[],
  });
  const [teamMember, setTeamMember] = useState("");

  // Filter projects based on search and filter criteria
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "All" || project.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleAddProject = () => {
    if (!newProject.name.trim()) return;

    const newProj: Project = {
      id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
      name: newProject.name,
      status: newProject.status,
      progress: newProject.status === "Completed" ? 100 : 0,
      team: newProject.team,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      description: newProject.description,
    };

    setProjects([...projects, newProj]);
    resetForm();
    setIsModalOpen(false);

    // Simulate notification
    alert(`📢 New project "${newProj.name}" has been created and assigned to team members!`);
  };

  const handleUpdateProject = () => {
    if (!selectedProject || !newProject.name.trim()) return;

    const updatedProjects = projects.map(project => 
      project.id === selectedProject.id ? {
        ...project,
        name: newProject.name,
        status: newProject.status,
        progress: newProject.status === "Completed" ? 100 : 
                 project.status === "In Progress" && newProject.status !== "In Progress" ? 0 : 
                 project.progress,
        team: newProject.team,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        description: newProject.description,
      } : project
    );

    setProjects(updatedProjects);
    resetForm();
    setIsModalOpen(false);
    setSelectedProject(null);
    setIsEditMode(false);

    alert(`✅ Project "${newProject.name}" has been updated successfully!`);
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;

    const updatedProjects = projects.filter(project => project.id !== selectedProject.id);
    setProjects(updatedProjects);
    setIsDeleteModalOpen(false);
    setSelectedProject(null);

    alert(`🗑️ Project "${selectedProject.name}" has been deleted!`);
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setNewProject({
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      team: [...project.team],
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setNewProject({
      name: "",
      description: "",
      status: "Pending",
      startDate: "",
      endDate: "",
      team: [],
    });
    setTeamMember("");
  };

  const addTeamMember = () => {
    if (teamMember.trim() && !newProject.team.includes(teamMember)) {
      setNewProject({
        ...newProject,
        team: [...newProject.team, teamMember]
      });
      setTeamMember("");
    }
  };

  const removeTeamMember = (member: string) => {
    setNewProject({
      ...newProject,
      team: newProject.team.filter(m => m !== member)
    });
  };

  const getStatusIcon = (status: "Completed" | "Pending" | "In Progress") => {
    switch (status) {
      case "Completed": return <FiCheckCircle className="text-green-500" />;
      case "Pending": return <FiClock className="text-yellow-500" />;
      case "In Progress": return <FiLoader className="text-blue-500 animate-spin" />;
      default: return null;
    }
  };

  const getProgressBarColor = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate statistics for dashboard
  const completedCount = projects.filter(p => p.status === "Completed").length;
  const inProgressCount = projects.filter(p => p.status === "In Progress").length;
  const pendingCount = projects.filter(p => p.status === "Pending").length;

  return (
    <DashboardLayout role='ceo'>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Projects Dashboard</h1>
            <p className="text-gray-600">Manage and track all company projects</p>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <FiBarChart2 size={20} />
              </div>
              <div>
                <h3 className="text-sm text-gray-600">Total Projects</h3>
                <p className="text-2xl font-bold text-gray-800">{projects.length}</p>
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
                <p className="text-2xl font-bold text-gray-800">{completedCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 mr-4">
                <FiLoader size={20} />
              </div>
              <div>
                <h3 className="text-sm text-gray-600">In Progress</h3>
                <p className="text-2xl font-bold text-gray-800">{inProgressCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
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
                onChange={(e) => setStatusFilter(e.target.value as any)}
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
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-800">{project.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{project.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full w-fit
                          ${
                            project.status === "Completed"
                              ? "bg-green-100 text-green-600"
                              : project.status === "Pending"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                      >
                        {getStatusIcon(project.status)}
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 text-xs text-gray-500">{project.progress}%</div>
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getProgressBarColor(project.progress)}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member, index) => (
                          <div key={index} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                            <FiUser className="text-blue-600 text-xs" />
                          </div>
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div className="flex items-center gap-1">
                          <FiCalendar className="text-gray-400" />
                          {new Date(project.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-400">to</div>
                        <div className="flex items-center gap-1">
                          <FiCalendar className="text-gray-400" />
                          {new Date(project.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No projects found matching your criteria
                  </td>
                </tr>
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
                        value={newProject.startDate}
                        onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={newProject.endDate}
                        onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({...newProject, status: e.target.value as any})}
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
                      {newProject.team.map((member, index) => (
                        <span key={index} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
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
                  Are you sure you want to delete the project <strong>"{selectedProject?.name}"</strong>? This action cannot be undone.
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