'use client';

import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';

interface Project {
  id: number | string;
  name: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  assigned_to?: string;
  members?: string[];
  created_at?: string;
  updated_at?: string;
  email?: string;
  [key: string]: string | number | string[] | undefined;
}

interface User {
  email: string;
  fullname?: string;
  name?: string;
  department?: string;
  designation?: string;
  profile_picture?: string; // Add profile picture field
}

// Add role prop to the component
interface ProjectPageProps {
  role?: string;
}

const ProjectPage = ({ role }: ProjectPageProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Planning',
    members: [] as string[],
  });

  // 🔹 Avatar fallback (similar to team report component)
  const getAvatar = (user: User) => {
    // Check if profile picture exists and is a valid URL
    if (user.profile_picture) {
      try {
        new URL(user.profile_picture);
        return user.profile_picture;
      } catch (error) {
        // If not a valid URL, fall back to the generated avatar
        console.error("Invalid profile picture URL:", error);
      }
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullname || user.email || 'User'
    )}&background=0D8ABC&color=fff&bold=true`;
  };

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const endpoints = [
          '/api/accounts/employees/',
          '/api/accounts/managers/',
          '/api/accounts/hrs/',
        ];
        
        const results = await Promise.all(
          endpoints.map(async (endpoint) => {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
              if (!res.ok) return [];
              
              const data = await res.json();
              const usersArray = Array.isArray(data) ? data : (data?.employees || data?.managers || data?.hrs || data?.data || data?.results || []);
              
              return usersArray.map((user: any) => ({
                email: user.email,
                fullname: user.fullname || user.name,
                department: user.department,
                designation: user.designation,
                profile_picture: user.profile_picture, // Include profile picture
              }));
            } catch (err) {
              console.error(`Error fetching from ${endpoint}:`, err);
              return [];
            }
          })
        );
        
        // Flatten and deduplicate users by email
        const allUsers = results.flat();
        const uniqueUsers = allUsers.filter((user, index, self) => 
          index === self.findIndex(u => u.email === user.email)
        );
        
        setUsers(uniqueUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_projects/`);
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        
        // For managers, CEOs, admins, and HR - show all projects
        // For employees - show only projects they are assigned to
        const isAdminRole = role && ['manager', 'ceo', 'admin', 'hr'].includes(role.toLowerCase());
        
        // Get user email from localStorage
        const userEmail = localStorage.getItem('user_email') || 
                         JSON.parse(localStorage.getItem('userInfo') || '{}')?.email;
        
        if (userEmail) {
          let filteredProjects = [];
          if (isAdminRole) {
            // Show all projects for admin roles
            filteredProjects = data.projects || data || [];
          } else {
            // Filter projects where user is a member for regular employees
            filteredProjects = (data.projects || data || []).filter((project: Project) =>
              Array.isArray(project.members) && project.members.includes(userEmail)
            );
          }
          
          // Normalize project data to ensure consistent structure
          const normalizedProjects = filteredProjects.map((project: Project) => ({
            ...project,
            title: project.title || project.name || 'Untitled Project',
            name: project.name || project.title || 'Untitled Project'
          }));
          
          setProjects(normalizedProjects);
        } else {
          // If no user email, show all projects (fallback)
          const allProjects = data.projects || data || [];
          const normalizedProjects = allProjects.map((project: Project) => ({
            ...project,
            title: project.title || project.name || 'Untitled Project',
            name: project.name || project.title || 'Untitled Project'
          }));
          setProjects(normalizedProjects);
        }
      } catch (err: unknown) {
        console.error('Error fetching projects:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [role]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get owner email from localStorage
      const userEmail = localStorage.getItem('user_email') || 
                       JSON.parse(localStorage.getItem('userInfo') || '{}')?.email;
      
      if (!userEmail) {
        throw new Error('User email not found in localStorage');
      }

      // Match the backend API field names
      const projectData = {
        name: newProject.title, // Backend expects "name" not "title"
        description: newProject.description,
        start_date: newProject.start_date,
        end_date: newProject.end_date,
        status: newProject.status,
        email: userEmail, // Backend expects "email" not "email_id"
        members: newProject.members.length > 0 ? newProject.members : [userEmail], // Backend expects array of emails
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_project/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      // Get the created project data from response
      const createdProject = await res.json();
      
      // Add the new project to the list
      setProjects([
        ...projects, 
        {
          id: createdProject.id,
          title: createdProject.name, // Convert backend "name" to frontend "title"
          name: createdProject.name,
          description: newProject.description,
          start_date: newProject.start_date,
          end_date: newProject.end_date,
          status: newProject.status,
          members: newProject.members.length > 0 ? newProject.members : [userEmail],
          created_at: createdProject.created_at || new Date().toISOString(),
        }
      ]);
      
      setIsCreateModalOpen(false);
      setNewProject({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'Planning',
        members: [],
      });
    } catch (err: unknown) {
      console.error('Error creating project:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create project');
      }
    }
  };

  const toggleMemberSelection = (email: string) => {
    setNewProject(prev => {
      const isSelected = prev.members.includes(email);
      return {
        ...prev,
        members: isSelected 
          ? prev.members.filter(member => member !== email)
          : [...prev.members, email]
      };
    });
  };

  if (loading) return <div className="p-6 text-center">Loading projects...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">Manage and track all your assigned projects</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Project
          </button>
        </div>
        
        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6">Get started by creating a new project</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer transform hover:-translate-y-1"
                onClick={() => {
                  setSelectedProject(project);
                  setIsModalOpen(true);
                }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{project.title}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.members?.slice(0, 3).map((member, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-medium text-blue-800">
                          {member.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {project.members && project.members.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {project.members?.length || 0} member{project.members && project.members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {isCreateModalOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsCreateModalOpen(false)}></div>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold rounded-full p-2 hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Create New Project</h2>
                <form onSubmit={handleCreateProject} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter project title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter project description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={newProject.start_date}
                        onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={newProject.end_date}
                        onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Members ({newProject.members.length} selected)
                    </label>
                    <div className="border border-gray-300 rounded-xl p-4 max-h-60 overflow-y-auto">
                      {loadingUsers ? (
                        <div className="text-center py-4 text-gray-500">Loading users...</div>
                      ) : users.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No users found</div>
                      ) : (
                        <div className="space-y-2">
                          {users.map((user) => (
                            <div 
                              key={user.email}
                              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                                newProject.members.includes(user.email) 
                                  ? 'bg-blue-50 border border-blue-200' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => toggleMemberSelection(user.email)}
                            >
                              <div className="flex items-center flex-1">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-3">
                                  {user.fullname?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {user.fullname || user.email}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                newProject.members.includes(user.email)
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-gray-300'
                              }`}>
                                {newProject.members.includes(user.email) && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Project Detail Modal */}
        {isModalOpen && selectedProject && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsModalOpen(false)}></div>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold rounded-full p-2 hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  &times;
                </button>
                <div className="mb-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <h2 className="text-3xl font-bold text-gray-900">{selectedProject.title}</h2>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  
                  {selectedProject.description && (
                    <p className="text-gray-600 text-lg">{selectedProject.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(selectedProject.start_date)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(selectedProject.end_date)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Members</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedProject.members?.length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(selectedProject.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Team Members</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedProject.members && selectedProject.members.length > 0 ? (
                      selectedProject.members.map((member, idx) => {
                        const user = users.find(u => u.email === member) || { email: member };
                        return (
                          <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-3">
                              {user.profile_picture ? (
                                <Image 
                                  src={getAvatar(user)} 
                                  alt={user.fullname || user.email}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      user.fullname || user.email || 'User'
                                    )}&background=0D8ABC&color=fff&bold=true`;
                                  }}
                                />
                              ) : (
                                <span>{user.fullname?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.fullname || user.email}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email === (localStorage.getItem('user_email') || 
                                               JSON.parse(localStorage.getItem('userInfo') || '{}')?.email) 
                                  ? 'You' 
                                  : 'Member'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 col-span-full text-center py-4">No members assigned</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Project Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Project ID</h4>
                      <p className="text-gray-900">{selectedProject.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                      <p className="text-gray-900">{formatDate(selectedProject.updated_at)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                      <p className="text-gray-900">{selectedProject.assigned_to || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Contact Email</h4>
                      <p className="text-gray-900">{selectedProject.email || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;

// Helper to format date and time for created_at and updated_at fields
function formatDateTime(dateString?: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}