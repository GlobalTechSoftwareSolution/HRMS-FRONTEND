"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Employee email or name
  sent: boolean;
  createdAt: string;
};

export default function ManagerTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [sending, setSending] = useState(false);

  // Load tasks from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("manager_tasks");
    if (stored) setTasks(JSON.parse(stored));
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("manager_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleSendTask = () => {
    if (!title || !description || !assignedTo) {
      alert("Please fill all fields");
      return;
    }

    setSending(true);
    setTimeout(() => {
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        description,
        assignedTo,
        sent: true,
        createdAt: new Date().toISOString(),
      };

      setTasks(prev => [newTask, ...prev]);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setSending(false);
      alert("Task sent successfully!");
    }, 500);
  };

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Manager Task Portal 📝
          </h1>
          <p className="text-gray-500 mb-6">Assign daily tasks to your employees.</p>

          {/* Task Form */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-3">Create New Task</h2>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <input
                type="text"
                placeholder="Task Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
              <input
                type="text"
                placeholder="Assign to (email)"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
            <textarea
              placeholder="Task Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
              rows={3}
            />
            <button
              onClick={handleSendTask}
              disabled={sending}
              className={`mt-3 px-4 py-2 rounded-lg text-white font-medium transition-all ${
                sending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {sending ? "Sending..." : "Send Task"}
            </button>
          </div>

          {/* Task List */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 animate-fade-in">
            <h2 className="text-lg font-semibold mb-3">Sent Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks sent yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-gray-800">{task.title}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{task.description}</p>
                    <div className="text-sm text-gray-700">Assigned to: {task.assignedTo}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DashboardLayout>
  );
}
