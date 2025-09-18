"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/app/lib/supabaseClient";

type Task = {
  task_id: number; // comes from DB (auto-generated integer or serial)
  description: string;
  department: string;
  priority: string;
  status: string;
  start_date: string;
  due_date: string | null;
  completed_date: string | null;
  email: string;
};

export default function ManagerTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [sending, setSending] = useState(false);

  // ✅ Fetch tasks from Supabase
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("accounts_tasktable")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setTasks(data as Task[]);
      }
    };

    fetchTasks();
  }, []);

  // ✅ Send new task (no task_id from frontend)
  const handleSendTask = async () => {
    if (!description || !assignedTo || !department) {
      alert("Please fill all fields");
      return;
    }

    setSending(true);

    const newTask = {
      description,
      department,
      priority,
      status: "Pending",
      start_date: new Date().toISOString(),
      due_date: null,
      completed_date: null,
      email: assignedTo,
    };

    const { data, error } = await supabase
      .from("accounts_tasktable")
      .insert([newTask])
      .select(); // ✅ fetch inserted row with real task_id

    setSending(false);

    if (error) {
      console.error("Insert error:", error);
      alert("Failed to send task: " + error.message);
    } else if (data && data.length > 0) {
      setTasks((prev) => [data[0] as Task, ...prev]); // ✅ use DB-generated task_id
      setDescription("");
      setAssignedTo("");
      setDepartment("");
      setPriority("Medium");
      alert("Task sent successfully!");
    }
  };

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Manager Task Portal 📝
          </h1>
          <p className="text-gray-500 mb-6">
            Assign daily tasks to your employees.
          </p>

          {/* Task Form */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-3">Create New Task</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Assign to (email)"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
              <input
                type="text"
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <textarea
                placeholder="Task Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
                rows={3}
              />
              <button
                onClick={handleSendTask}
                disabled={sending}
                className={`mt-3 px-4 py-2 rounded-lg text-white font-medium transition-all ${
                  sending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {sending ? "Sending..." : "Send Task"}
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 animate-fade-in">
            <h2 className="text-lg font-semibold mb-3">Sent Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks sent yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                  <div
                    key={task.task_id}
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-gray-800">
                        {task.department} — {task.priority}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(task.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{task.description}</p>
                    <div className="text-sm text-gray-700">
                      Assigned to: {task.email_id}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {task.status}
                    </div>
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
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
