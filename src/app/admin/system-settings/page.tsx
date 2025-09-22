"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type SystemInfo = {
  appName: string;
  version: string;
  environment: string;
  lastUpdated: string;
};

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);

  const [settings, setSettings] = useState({
    appName: "HRMS Admin Panel",
    timeZone: "(UTC-08:00) Pacific Time",
    dateFormat: "YYYY-MM-DD",
    language: "English",
    passwordPolicy: "Medium (8+ characters with letters and numbers)",
    sessionTimeout: "1 hour",
    twoFactorAuth: "Disabled",
    loginAttempts: 5,
    systemStatus: "Online",
  });

  // Fetch system info (simulated)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSystemInfo({
        appName: settings.appName,
        version: "1.0.2",
        environment: "Production",
        lastUpdated: new Date().toLocaleString(),
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [settings.appName]); // ✅ added dependency

  // Notification handler
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    setSystemInfo((prev) => ({
      ...prev!,
      appName: settings.appName,
      lastUpdated: new Date().toLocaleString(),
    }));
    setEditMode(false);
    showNotification("Settings saved successfully", "success");
  };

  const handleInputChange = (key: string, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout role="admin">
      <div className="container mx-auto p-6">

        {/* Breadcrumb */}
        <div className="breadcrumb flex items-center gap-2 mb-7 text-gray-500 text-sm">
          <a href="#" className="text-indigo-600">Dashboard</a>
          <span>&gt;</span>
          <span>System Settings</span>
        </div>

        {/* Page Header */}
        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <i className="fas fa-cog"></i> System Settings
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-5 py-2 font-semibold rounded-lg transition-transform transform hover:scale-105 shadow-md 
                ${editMode ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
            {editMode && (
              <button
                onClick={handleSave}
                className="px-5 py-2 font-semibold rounded-lg bg-green-600 text-white shadow-md transition-transform transform hover:scale-105 hover:bg-green-700"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs flex gap-1 border-b mb-7 flex-wrap">
          {["overview", "general", "security", "maintenance"].map((tab) => (
            <div
              key={tab}
              className={`tab px-6 py-3 font-medium cursor-pointer ${activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 border-b-2 border-transparent"} transition-colors`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        {/* Tab Contents */}
        <div>
          {/* Overview */}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
                <div className="bg-white p-5 rounded-lg shadow flex flex-col">
                  <div className="w-12 h-12 mb-3 text-indigo-600 bg-indigo-100 flex items-center justify-center rounded-lg">
                    <i className="fas fa-database"></i>
                  </div>
                  <div className="text-2xl font-bold">2.5 GB</div>
                  <div className="text-gray-500">Database Size</div>
                </div>
                <div className="bg-white p-5 rounded-lg shadow flex flex-col">
                  <div className="w-12 h-12 mb-3 text-green-600 bg-green-100 flex items-center justify-center rounded-lg">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="text-2xl font-bold">154</div>
                  <div className="text-gray-500">Active Users</div>
                </div>
                <div className="bg-white p-5 rounded-lg shadow flex flex-col">
                  <div className="w-12 h-12 mb-3 text-yellow-500 bg-yellow-100 flex items-center justify-center rounded-lg">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="text-2xl font-bold">99.8%</div>
                  <div className="text-gray-500">Uptime</div>
                </div>
                <div className="bg-white p-5 rounded-lg shadow flex flex-col">
                  <div className="w-12 h-12 mb-3 text-blue-600 bg-blue-100 flex items-center justify-center rounded-lg">
                    <i className="fas fa-server"></i>
                  </div>
                  <div className="text-2xl font-bold">42°C</div>
                  <div className="text-gray-500">CPU Temp</div>
                </div>
              </div>

              {/* System Info Card */}
              <div className="bg-white p-7 rounded-xl shadow mb-7">
                <div className="flex justify-between items-center border-b pb-4 mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><i className="fas fa-info-circle"></i> System Info</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                    {systemInfo?.environment || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 flex items-center gap-2"><i className="fas fa-signature"></i> App Name</div>
                    <div className="text-md font-medium">{systemInfo?.appName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 flex items-center gap-2"><i className="fas fa-code-branch"></i> Version</div>
                    <div className="text-md font-medium">{systemInfo?.version}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 flex items-center gap-2"><i className="fas fa-calendar-alt"></i> Last Updated</div>
                    <div className="text-md font-medium">{systemInfo?.lastUpdated}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 flex items-center gap-2"><i className="fas fa-layer-group"></i> Environment</div>
                    <div className="text-md font-medium">{systemInfo?.environment}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* General */}
          {activeTab === "general" && (
            <div className="bg-white p-7 rounded-xl shadow mb-7 grid gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Application Name</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={settings.appName}
                  onChange={(e) => handleInputChange("appName", e.target.value)}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Time Zone</label>
                <select
                  disabled={!editMode}
                  value={settings.timeZone}
                  onChange={(e) => handleInputChange("timeZone", e.target.value)}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                >
                  <option>(UTC+00:00) London</option>
                  <option>(UTC-05:00) New York</option>
                  <option>(UTC-08:00) Pacific Time</option>
                  <option>(UTC+01:00) Paris</option>
                  <option>(UTC+08:00) Singapore</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Date Format</label>
                <select
                  disabled={!editMode}
                  value={settings.dateFormat}
                  onChange={(e) => handleInputChange("dateFormat", e.target.value)}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                >
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Language</label>
                <select
                  disabled={!editMode}
                  value={settings.language}
                  onChange={(e) => handleInputChange("language", e.target.value)}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="bg-white p-7 rounded-xl shadow mb-7 grid gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Password Policy</label>
                <select
                  disabled={!editMode}
                  value={settings.passwordPolicy}
                  onChange={(e) => handleInputChange("passwordPolicy", e.target.value)}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                >
                  <option>Low (6+ characters)</option>
                  <option>Medium (8+ characters with letters and numbers)</option>
                  <option>High (12+ characters mixed case, numbers & symbols)</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Session Timeout</label>
                <select
                  disabled={!editMode}
                  value={settings.sessionTimeout}
                  onChange={(e) => handleInputChange("sessionTimeout", e.target.value)}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                >
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>Never</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                <select
                  disabled={!editMode}
                  value={settings.twoFactorAuth}
                  onChange={(e) => handleInputChange("twoFactorAuth", e.target.value)}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                >
                  <option>Disabled</option>
                  <option>Optional</option>
                  <option>Required for Admins</option>
                  <option>Required for All Users</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Login Attempts</label>
                <input
                  type="number"
                  disabled={!editMode}
                  value={settings.loginAttempts}
                  onChange={(e) => handleInputChange("loginAttempts", Number(e.target.value))}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                />
              </div>
            </div>
          )}

          {/* Maintenance */}
          {activeTab === "maintenance" && (
            <div className="bg-white p-7 rounded-xl shadow mb-7 grid gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">System Status</label>
                <select
                  disabled={!editMode}
                  value={settings.systemStatus}
                  onChange={(e) => handleInputChange("systemStatus", e.target.value)}
                  className="w-full p-3 border rounded-md disabled:bg-gray-100"
                >
                  <option>Online</option>
                  <option>Maintenance Mode</option>
                  <option>Offline</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Notification */}
        {notification && (
          <div className={`fixed top-5 right-5 px-5 py-3 rounded-lg text-white flex items-center gap-2 shadow-md transition-all ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
            <i className={`fas ${notification.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
            <span>{notification.message}</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
