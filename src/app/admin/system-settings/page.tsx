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

  // Detect mobile view
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch system info (simulated)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSystemInfo({
        appName: settings.appName,
        version: "1.0.2",
        environment: "Production",
        lastUpdated: new Date().toLocaleString(),
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [settings.appName]);

  // Notification handler
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle input change
  const handleInputChange = (key: string, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save changes
  const handleSave = () => {
    setSystemInfo((prev) => ({
      ...prev!,
      appName: settings.appName,
      lastUpdated: new Date().toLocaleString(),
    }));
    setEditMode(false);
    showNotification("Settings saved successfully", "success");
  };

  // Render input field
  const renderInput = (key: string, label: string, type: "text" | "number" | "select", options?: string[]) => {
    if (type === "select") {
      return (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
          <select
            disabled={!editMode}
            value={settings[key as keyof typeof settings]}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="w-full p-3 border rounded-md disabled:bg-gray-100"
          >
            {options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    } else {
      return (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
          <input
            type={type}
            disabled={!editMode}
            value={settings[key as keyof typeof settings]}
            onChange={(e) => handleInputChange(key, type === "number" ? Number(e.target.value) : e.target.value)}
            className="w-full p-3 border rounded-md disabled:bg-gray-100"
          />
        </div>
      );
    }
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
                {[
                  { title: "Database Size", value: "2.5 GB", icon: "fas fa-database", bg: "bg-indigo-100", text: "text-indigo-600" },
                  { title: "Active Users", value: "154", icon: "fas fa-users", bg: "bg-green-100", text: "text-green-600" },
                  { title: "Uptime", value: "99.8%", icon: "fas fa-clock", bg: "bg-yellow-100", text: "text-yellow-500" },
                  { title: "CPU Temp", value: "42°C", icon: "fas fa-server", bg: "bg-blue-100", text: "text-blue-600" },
                ].map((card) => (
                  <div key={card.title} className="bg-white p-5 rounded-lg shadow flex flex-col">
                    <div className={`w-12 h-12 mb-3 flex items-center justify-center rounded-lg ${card.bg} ${card.text}`}>
                      <i className={card.icon}></i>
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="text-gray-500">{card.title}</div>
                  </div>
                ))}
              </div>

              {/* Added System Info section */}
              {systemInfo && (
                <div className="bg-white p-5 rounded-lg shadow mb-7">
                  <h2 className="text-lg font-semibold mb-3">System Information</h2>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>App Name:</strong> {systemInfo.appName}</li>
                    <li><strong>Version:</strong> {systemInfo.version}</li>
                    <li><strong>Environment:</strong> {systemInfo.environment}</li>
                    <li><strong>Last Updated:</strong> {systemInfo.lastUpdated}</li>
                  </ul>
                </div>
              )}
            </>
          )}

          {/* General / Security / Maintenance */}
          {["general", "security", "maintenance"].includes(activeTab) && (
            <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-2 gap-6"} mb-7`}>
              {activeTab === "general" && (
                <>
                  <div className="bg-white p-5 rounded-xl shadow">{renderInput("appName", "Application Name", "text")}</div>
                  <div className="bg-white p-5 rounded-xl shadow">{renderInput("timeZone", "Time Zone", "select", [
                    "(UTC+00:00) London",
                    "(UTC-05:00) New York",
                    "(UTC-08:00) Pacific Time",
                    "(UTC+01:00) Paris",
                    "(UTC+08:00) Singapore",
                  ])}</div>
                  <div className="bg-white p-5 rounded-xl shadow">{renderInput("dateFormat", "Date Format", "select", ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"])}</div>
                  <div className="bg-white p-5 rounded-xl shadow">{renderInput("language", "Language", "select", ["English", "Spanish", "French", "German"])}</div>
                </>
              )}

              {activeTab === "security" && (
                <>
                  <div className="bg-white p-5 rounded-xl shadow">{renderInput("passwordPolicy", "Password Policy", "select", ["Low (6+ characters)", "Medium (8+ characters with letters and numbers)", "High (12+ characters mixed case, numbers & symbols)"])}</div>
                  <div className="bg-white p-5 rounded-xl shadow">{renderInput("sessionTimeout", "Session Timeout", "select", ["15 minutes", "30 minutes", "1 hour", "4 hours", "Never"])}</div>
                  <div className="bg-white p-5 rounded-xl shadow">{renderInput("twoFactorAuth", "Two-Factor Authentication", "select", ["Disabled", "Optional", "Required for Admins", "Required for All Users"])}</div>
                  <div className="bg-white p-5 rounded-xl shadow">{renderInput("loginAttempts", "Login Attempts", "number")}</div>
                </>
              )}

              {activeTab === "maintenance" && (
                <div className="bg-white p-5 rounded-xl shadow">{renderInput("systemStatus", "System Status", "select", ["Online", "Maintenance Mode", "Offline"])}</div>
              )}
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
