'use client';

import { useEffect, useState } from 'react';

interface Project {
  id: number | string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  assigned_to?: string;
  members?: string[];
  [key: string]: string | number | string[] | undefined;
}

const ProjectPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('https://globaltechsoftwaresolutions.cloud/api/accounts/list_projects/');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        // Assuming the API returns { projects: [...] }
        const userEmail = localStorage.getItem('user_email');
        if (userEmail) {
          const filteredProjects = (data.projects || []).filter((project: Project) =>
            Array.isArray(project.members) && project.members.includes(userEmail)
          );
          setProjects(filteredProjects);
        } else {
          setProjects([]);
        }
      } catch (err: unknown) {
        console.error(err);
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
  }, []);

  if (loading) return <div className="p-6">Loading projects...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
      <div className="min-h-screen p-6 bg-gray-50 text-black">
        <h1 className="text-2xl font-bold mb-6">Projects Assigned</h1>
        {projects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          <div className="flex flex-wrap -m-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col justify-between bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out m-4 w-full sm:w-[48%] lg:w-[31%] cursor-pointer"
                onClick={() => {
                  setSelectedProject(project);
                  setIsModalOpen(true);
                }}
              >
                <div className='text-black'>
                  <h2 className="text-xl font-semibold text-black-800">{project.title}</h2>
                  {project.description && <p className="text-sm text-gray-600 mt-3">{project.description}</p>}
                </div>
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium text-gray-700">Start:</span>{' '}
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">End:</span>{' '}
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Status:</span> {project.status || 'N/A'}
                  </p>
                  {project.assigned_to && (
                    <p>
                      <span className="font-medium text-gray-700">Assigned to:</span> {project.assigned_to}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && selectedProject && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsModalOpen(false)}></div>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
                  aria-label="Close modal"
                >
                  &times;
                </button>
                <h2 className="text-3xl font-bold mb-6">{selectedProject.title}</h2>
                {selectedProject.description && (
                  <p className="mb-6 text-gray-700">{selectedProject.description}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
                  <div className="bg-gray-100 rounded-lg p-4 shadow">
                    <h3 className="text-lg font-semibold mb-2">Start Date</h3>
                    <p className="text-gray-800">
                      {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 shadow">
                    <h3 className="text-lg font-semibold mb-2">End Date</h3>
                    <p className="text-gray-800">
                      {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 shadow">
                    <h3 className="text-lg font-semibold mb-2">Status</h3>
                    <p className="text-gray-800">{selectedProject.status || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 shadow">
                    <h3 className="text-lg font-semibold mb-2">Members</h3>
                    {selectedProject.members && selectedProject.members.length > 0 ? (
                      <ul className="list-disc list-inside text-gray-800 max-h-32 overflow-y-auto">
                        {selectedProject.members.map((member, idx) => (
                          <li key={idx}>{member}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No members</p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-inner max-h-60 overflow-y-auto">
                  <h3 className="text-xl font-semibold mb-4">Additional Information</h3>
                  <div className="space-y-2 text-gray-700 text-sm">
                    {Object.entries(selectedProject).map(([key, value]) => {
                      if (
                        ['id', 'title', 'description', 'start_date', 'end_date', 'status', 'assigned_to', 'members'].includes(key) ||
                        value === undefined ||
                        value === null
                      ) {
                        return null;
                      }
                      return (
                        <p key={key}>
                          <span className="font-semibold">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</span>{' '}
                          {typeof value === 'string' || typeof value === 'number' ? value.toString() : JSON.stringify(value)}
                        </p>
                      );
                    })}
                    {selectedProject.assigned_to && (
                      <p>
                        <span className="font-semibold">Assigned To:</span> {selectedProject.assigned_to}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

  );
};

export default ProjectPage;