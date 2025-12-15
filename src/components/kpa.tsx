"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiEdit3, FiSave, FiX, FiPlus, FiTrash2 } from "react-icons/fi";

// Define types for our data
type KPA = {
  id: number;
  area: string;
  description: string;
  responsibilities: string[];
};

export default function KPAPage() {
  const [kpas, setKpas] = useState<KPA[]>([]);
  const [loading, setLoading] = useState(true);

  
  // Form states for editing/adding
  const [editingKpa, setEditingKpa] = useState<KPA | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKpa, setNewKpa] = useState<{ area: string; description: string; responsibilities: string }>({ 
    area: "", 
    description: "", 
    responsibilities: "" 
  });
  const [newResponsibility, setNewResponsibility] = useState("");

  // Load initial data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const initialKpaData: KPA[] = [
        {
          id: 1,
          area: "Frontend Development",
          description: "Building user interfaces and components",
          responsibilities: ["React components", "UI/UX implementation", "Performance optimization"]
        },
        {
          id: 2, 
          area: "Backend Development",
          description: "Server-side logic and APIs",
          responsibilities: ["REST APIs", "Database design", "Authentication"]
        },
        {
          id: 3,
          area: "Code Quality",
          description: "Maintaining code standards",
          responsibilities: ["Code reviews", "Testing", "Documentation"]
        }
      ];
      setKpas(initialKpaData);
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

  // Add responsibility to KPA
  const addResponsibility = (kpaId: number, responsibility: string) => {
    if (!responsibility.trim()) return;
    
    setKpas(kpas.map(kpa => {
      if (kpa.id === kpaId) {
        return { ...kpa, responsibilities: [...kpa.responsibilities, responsibility] };
      }
      return kpa;
    }));
    setNewResponsibility("");
  };

  // Remove responsibility from KPA
  const removeResponsibility = (kpaId: number, index: number) => {
    setKpas(kpas.map(kpa => {
      if (kpa.id === kpaId) {
        const newResponsibilities = [...kpa.responsibilities];
        newResponsibilities.splice(index, 1);
        return { ...kpa, responsibilities: newResponsibilities };
      }
      return kpa;
    }));
  };

  // Save KPA (new or edited)
  const saveKpa = () => {
    if (editingKpa) {
      // Update existing KPA
      setKpas(kpas.map(kpa => kpa.id === editingKpa.id ? editingKpa : kpa));
      setEditingKpa(null);
    } else {
      // Create new KPA
      const responsibilitiesArray = newKpa.responsibilities
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const newKpaWithId = { 
        ...newKpa, 
        id: Math.max(0, ...kpas.map(k => k.id)) + 1,
        responsibilities: responsibilitiesArray
      };
      
      setKpas([...kpas, newKpaWithId]);
      setNewKpa({ area: "", description: "", responsibilities: "" });
      setShowAddForm(false);
    }
  };

  // Delete KPA
  const deleteKpa = (id: number) => {
    setKpas(kpas.filter(kpa => kpa.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-lg">Loading KPA data...</div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto text-black">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Key Performance Areas</h1>
          <Link 
            href="/employee/Kra&Kpa" 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Go to KRA →
          </Link>
        </div>

        {/* Add KPA Form */}
        {showAddForm && !editingKpa && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Add New KPA</h2>
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
                <input
                  type="text"
                  name="description"
                  value={newKpa.description}
                  onChange={handleKpaChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter description"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities (comma separated)</label>
                <textarea
                  name="responsibilities"
                  value={newKpa.responsibilities}
                  onChange={handleKpaChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter responsibilities separated by commas"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveKpa}
                className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                <FiSave /> Save
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewKpa({ area: "", description: "", responsibilities: "" });
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
          <div className="mb-8 p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Edit KPA</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <input
                  type="text"
                  name="area"
                  value={editingKpa.area}
                  onChange={(e) => setEditingKpa({...editingKpa, area: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={editingKpa.description}
                  onChange={(e) => setEditingKpa({...editingKpa, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newResponsibility}
                    onChange={(e) => setNewResponsibility(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                    placeholder="Add new responsibility"
                  />
                  <button
                    onClick={() => addResponsibility(editingKpa.id, newResponsibility)}
                    className="bg-blue-500 text-white px-3 rounded-md hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {editingKpa.responsibilities.map((resp, index) => (
                    <li key={index} className="text-gray-600 flex justify-between">
                      <span>{resp}</span>
                      <button 
                        onClick={() => removeResponsibility(editingKpa.id, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveKpa}
                  className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
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
          </div>
        )}

        {/* KPA Cards */}
        <div className="space-y-6">
          {kpas.map((kpa) => (
            <div key={kpa.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              {editingKpa?.id !== kpa.id ? (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-2">{kpa.area}</h2>
                      <p className="text-gray-600 mb-4">{kpa.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingKpa(kpa);
                          setShowAddForm(false);
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
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-700">Responsibilities:</h3>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {kpa.responsibilities.map((resp, index) => (
                        <li key={index} className="text-gray-600">{resp}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* Add New KPA Button */}
        <button 
          onClick={() => {
            setEditingKpa(null);
            setShowAddForm(true);
          }}
          className="mt-8 flex items-center gap-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
        >
          <FiPlus /> Add New KPA
        </button>
      </div>
    </div>
  );
}