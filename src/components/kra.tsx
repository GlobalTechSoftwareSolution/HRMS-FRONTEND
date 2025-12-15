"use client";
import React, { useState, useEffect } from "react";
import { FiEdit3, FiCheckCircle, FiTrendingUp, FiList, FiPlus, FiSave, FiX, FiTrash2 } from "react-icons/fi";

// Define types for our data
type KPA = {
  id: number;
  area: string;
  description: string;
};

type KRA = {
  id: number;
  kpa: string;
  result: string;
  target: string;
  status: string;
};

export default function KRA() {
  const [activeTab, setActiveTab] = useState<"KPA" | "KRA">("KRA");
  const [kpaData, setKpaData] = useState<KPA[]>([]);
  const [kraData, setKraData] = useState<KRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for editing/adding
  const [editingKpa, setEditingKpa] = useState<KPA | null>(null);
  const [editingKra, setEditingKra] = useState<KRA | null>(null);
  const [showAddKpaForm, setShowAddKpaForm] = useState(false);
  const [showAddKraForm, setShowAddKraForm] = useState(false);
  const [newKpa, setNewKpa] = useState<{ area: string; description: string }>({ area: "", description: "" });
  const [newKra, setNewKra] = useState<{ kpa: string; result: string; target: string; status: string }>({ 
    kpa: "", 
    result: "", 
    target: "", 
    status: "🟡 In Progress" 
  });

  // Load initial data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const initialKpaData: KPA[] = [
        { id: 1, area: "Development", description: "Responsible for building and maintaining application modules." },
        { id: 2, area: "Code Quality", description: "Ensure high coding standards and clean code practices." },
        { id: 3, area: "Team Collaboration", description: "Actively participate in sprints and assist teammates." },
      ];
      
      const initialKraData: KRA[] = [
        { id: 1, kpa: "Development", result: "Complete 3 new modules this quarter", target: "3", status: "✅ Done" },
        { id: 2, kpa: "Code Quality", result: "Maintain <2% bug rate after release", target: "<2%", status: "🟡 In Progress" },
        { id: 3, kpa: "Delivery", result: "Complete 95% sprint tasks on time", target: "95%", status: "🟢 On Track" },
      ];
      
      setKpaData(initialKpaData);
      setKraData(initialKraData);
      setLoading(false);
    }, 500);
  }, []);

  // Handle KPA form changes
  const handleKpaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingKpa) {
      setEditingKpa({ ...editingKpa, [name]: value });
    } else {
      setNewKpa({ ...newKpa, [name]: value });
    }
  };

  // Handle KRA form changes
  const handleKraChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingKra) {
      setEditingKra({ ...editingKra, [name]: value });
    } else {
      setNewKra({ ...newKra, [name]: value });
    }
  };

  // Save KPA (new or edited)
  const saveKpa = () => {
    if (editingKpa) {
      // Update existing KPA
      setKpaData(kpaData.map(kpa => kpa.id === editingKpa.id ? editingKpa : kpa));
      setEditingKpa(null);
    } else {
      // Create new KPA
      const newKpaWithId = { ...newKpa, id: Math.max(0, ...kpaData.map(k => k.id)) + 1 };
      setKpaData([...kpaData, newKpaWithId]);
      setNewKpa({ area: "", description: "" });
      setShowAddKpaForm(false);
    }
  };

  // Save KRA (new or edited)
  const saveKra = () => {
    if (editingKra) {
      // Update existing KRA
      setKraData(kraData.map(kra => kra.id === editingKra.id ? editingKra : kra));
      setEditingKra(null);
    } else {
      // Create new KRA
      const newKraWithId = { ...newKra, id: Math.max(0, ...kraData.map(k => k.id)) + 1 };
      setKraData([...kraData, newKraWithId]);
      setNewKra({ kpa: "", result: "", target: "", status: "🟡 In Progress" });
      setShowAddKraForm(false);
    }
  };

  // Delete KPA
  const deleteKpa = (id: number) => {
    setKpaData(kpaData.filter(kpa => kpa.id !== id));
  };

  // Delete KRA
  const deleteKra = (id: number) => {
    setKraData(kraData.filter(kra => kra.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
        <div className="text-lg">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
        <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiTrendingUp className="text-blue-600" /> Key Result Areas
      </h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("KPA")}
          className={`flex-1 py-3 text-center font-semibold ${
            activeTab === "KPA" ? "text-blue-600 border-b-4 border-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiList className="inline mr-2" /> KPA
        </button>
        <button
          onClick={() => setActiveTab("KRA")}
          className={`flex-1 py-3 text-center font-semibold ${
            activeTab === "KRA" ? "text-blue-600 border-b-4 border-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FiCheckCircle className="inline mr-2" /> KRA
        </button>
      </div>

      {/* Content */}
      {activeTab === "KPA" ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">Key Performance Areas</h2>
            <button 
              onClick={() => {
                setEditingKpa(null);
                setShowAddKpaForm(true);
              }}
              className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <FiPlus /> Add New KPA
            </button>
          </div>

          {/* Add KPA Form */}
          {showAddKpaForm && !editingKpa && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-3">Add New KPA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    name="area"
                    value={newKpa.area}
                    onChange={handleKpaChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter KPA area"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={newKpa.description}
                    onChange={handleKpaChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter description"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveKpa}
                  className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <FiSave /> Save
                </button>
                <button
                  onClick={() => {
                    setShowAddKpaForm(false);
                    setNewKpa({ area: "", description: "" });
                  }}
                  className="flex items-center gap-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  <FiX /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Edit KPA Form */}
          {editingKpa && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-3">Edit KPA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    name="area"
                    value={editingKpa.area}
                    onChange={handleKpaChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={editingKpa.description}
                    onChange={handleKpaChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveKpa}
                  className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <FiSave /> Save
                </button>
                <button
                  onClick={() => setEditingKpa(null)}
                  className="flex items-center gap-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  <FiX /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* KPA List */}
          <div className="grid gap-4 md:grid-cols-2">
            {kpaData.map((kpa) => (
              <div
                key={kpa.id}
                className="border border-gray-200 rounded-lg p-5 bg-gray-50 hover:shadow-md transition duration-200"
              >
                <h3 className="font-bold text-lg text-gray-800">{kpa.area}</h3>
                <p className="text-gray-600 text-sm mt-2">{kpa.description}</p>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => {
                      setEditingKpa(kpa);
                      setShowAddKpaForm(false);
                    }}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <FiEdit3 /> Edit
                  </button>
                  <button 
                    onClick={() => deleteKpa(kpa.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">Key Result Areas</h2>
            <button 
              onClick={() => {
                setEditingKra(null);
                setShowAddKraForm(true);
              }}
              className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <FiPlus /> Add New KRA
            </button>
          </div>

          {/* Add KRA Form */}
          {showAddKraForm && !editingKra && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-3">Add New KRA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KPA</label>
                  <input
                    type="text"
                    name="kpa"
                    value={newKra.kpa}
                    onChange={handleKraChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter KPA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                  <input
                    type="text"
                    name="result"
                    value={newKra.result}
                    onChange={handleKraChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter result"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                  <input
                    type="text"
                    name="target"
                    value={newKra.target}
                    onChange={handleKraChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter target"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={newKra.status}
                    onChange={handleKraChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="✅ Done">Done</option>
                    <option value="🟡 In Progress">In Progress</option>
                    <option value="🟢 On Track">On Track</option>
                    <option value="🔴 Delayed">Delayed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveKra}
                  className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <FiSave /> Save
                </button>
                <button
                  onClick={() => {
                    setShowAddKraForm(false);
                    setNewKra({ kpa: "", result: "", target: "", status: "🟡 In Progress" });
                  }}
                  className="flex items-center gap-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  <FiX /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Edit KRA Form */}
          {editingKra && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-3">Edit KRA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KPA</label>
                  <input
                    type="text"
                    name="kpa"
                    value={editingKra.kpa}
                    onChange={handleKraChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                  <input
                    type="text"
                    name="result"
                    value={editingKra.result}
                    onChange={handleKraChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                  <input
                    type="text"
                    name="target"
                    value={editingKra.target}
                    onChange={handleKraChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editingKra.status}
                    onChange={handleKraChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="✅ Done">Done</option>
                    <option value="🟡 In Progress">In Progress</option>
                    <option value="🟢 On Track">On Track</option>
                    <option value="🔴 Delayed">Delayed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveKra}
                  className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <FiSave /> Save
                </button>
                <button
                  onClick={() => setEditingKra(null)}
                  className="flex items-center gap-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  <FiX /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* KRA List */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-50 text-gray-700 text-left">
                  <th className="py-3 px-4 border-b">KPA</th>
                  <th className="py-3 px-4 border-b">Result</th>
                  <th className="py-3 px-4 border-b">Target</th>
                  <th className="py-3 px-4 border-b">Status</th>
                  <th className="py-3 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kraData.map((kra) => (
                  <tr key={kra.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b font-semibold">{kra.kpa}</td>
                    <td className="py-3 px-4 border-b">{kra.result}</td>
                    <td className="py-3 px-4 border-b">{kra.target}</td>
                    <td className="py-3 px-4 border-b">{kra.status}</td>
                    <td className="py-3 px-4 border-b">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingKra(kra);
                            setShowAddKraForm(false);
                          }}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <FiEdit3 /> Edit
                        </button>
                        <button 
                          onClick={() => deleteKra(kra.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}