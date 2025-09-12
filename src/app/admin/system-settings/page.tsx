// app/admin/system-settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
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

  // Simulate fetching system info
  useEffect(() => {
    const fetchData = async () => {
      await new Promise((res) => setTimeout(res, 1000)); // simulate API delay
      setSystemInfo({
        appName: "HRMS Admin Panel",
        version: "1.0.2",
        environment: "Production",
        lastUpdated: new Date().toLocaleString(),
      });
    };
    fetchData();
  }, []);

  // Notification handler
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <DashboardLayout role="admin">
        <div className="container p-6">

      {/* Breadcrumb */}
      <div className="breadcrumb flex items-center gap-2 mb-7 text-gray-500 text-sm">
        <a href="#" className="text-indigo-600">Dashboard</a>
        <i className="fas fa-chevron-right text-xs"></i>
        <span>System Settings</span>
      </div>

      {/* Page Title */}
      <h1 className="page-title flex items-center gap-2 text-2xl font-bold mb-2">
        <i className="fas fa-cog"></i> System Settings
      </h1>
      <p className="page-description text-gray-500 mb-7 max-w-lg">
        Manage your application settings, view system information, and configure environment variables.
      </p>

      {/* Tabs */}
      <div className="tabs flex gap-1 border-b mb-7">
        {["overview", "general", "security", "maintenance"].map((tab) => (
          <div
            key={tab}
            className={`tab px-6 py-3 font-medium cursor-pointer ${activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 border-b-2 border-transparent"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
          </div>
        ))}
      </div>

      {/* Tab Contents */}
      <div>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
              <div className="stat-card bg-white p-5 rounded-lg shadow flex flex-col">
                <div className="stat-icon icon-primary w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-indigo-600 bg-indigo-100">
                  <i className="fas fa-database"></i>
                </div>
                <div className="stat-value text-2xl font-bold">2.5 GB</div>
                <div className="stat-label text-gray-500">Database Size</div>
              </div>
              <div className="stat-card bg-white p-5 rounded-lg shadow flex flex-col">
                <div className="stat-icon icon-success w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-green-600 bg-green-100">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-value text-2xl font-bold">154</div>
                <div className="stat-label text-gray-500">Active Users</div>
              </div>
              <div className="stat-card bg-white p-5 rounded-lg shadow flex flex-col">
                <div className="stat-icon icon-warning w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-yellow-500 bg-yellow-100">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-value text-2xl font-bold">99.8%</div>
                <div className="stat-label text-gray-500">Uptime</div>
              </div>
              <div className="stat-card bg-white p-5 rounded-lg shadow flex flex-col">
                <div className="stat-icon icon-info w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-blue-600 bg-blue-100">
                  <i className="fas fa-server"></i>
                </div>
                <div className="stat-value text-2xl font-bold">42°C</div>
                <div className="stat-label text-gray-500">CPU Temperature</div>
              </div>
            </div>

            {/* System Info Card */}
            <div className="card bg-white p-7 rounded-xl shadow mb-7">
              <div className="card-header flex justify-between items-center border-b pb-4 mb-5">
                <h2 className="card-title flex items-center gap-2 text-lg font-semibold">
                  <i className="fas fa-info-circle"></i> System Information
                </h2>
                <span className="status-badge px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                  {systemInfo?.environment || "-"}
                </span>
              </div>
              <div className="card-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div className="info-item">
                  <div className="info-label flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-signature"></i> Application Name
                  </div>
                  <div className="info-value text-md font-medium">{systemInfo?.appName || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-code-branch"></i> Version
                  </div>
                  <div className="info-value text-md font-medium">{systemInfo?.version || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-layer-group"></i> Environment
                  </div>
                  <div className="info-value text-md font-medium">{systemInfo?.environment || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-calendar-alt"></i> Last Updated
                  </div>
                  <div className="info-value text-md font-medium">{systemInfo?.lastUpdated || "-"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-server"></i> Server OS
                  </div>
                  <div className="info-value text-md font-medium">Ubuntu 22.04 LTS</div>
                </div>
                <div className="info-item">
                  <div className="info-label flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-microchip"></i> CPU Usage
                  </div>
                  <div className="info-value text-md font-medium">24%</div>
                </div>
                <div className="info-item">
                  <div className="info-label flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-memory"></i> Memory Usage
                  </div>
                  <div className="info-value text-md font-medium">1.8GB / 4GB (45%)</div>
                </div>
                <div className="info-item">
                  <div className="info-label flex items-center gap-2 text-sm text-gray-500">
                    <i className="fas fa-hdd"></i> Disk Usage
                  </div>
                  <div className="info-value text-md font-medium">45GB / 100GB (45%)</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons flex gap-5 flex-wrap">
              <button className="btn btn-primary px-5 py-3 bg-indigo-600 text-white rounded-lg flex items-center gap-2" onClick={() => showNotification("Data refreshed successfully", "success")}>
                <i className="fas fa-sync-alt"></i> Refresh Data
              </button>
              <button className="btn btn-secondary px-5 py-3 bg-gray-100 text-gray-700 border rounded-lg flex items-center gap-2">
                <i className="fas fa-download"></i> Export Configuration
              </button>
              <button className="btn btn-success px-5 py-3 bg-green-600 text-white rounded-lg flex items-center gap-2" onClick={() => showNotification("Settings saved successfully", "success")}>
                <i className="fas fa-save"></i> Save Changes
              </button>
            </div>
          </>
        )}

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="card bg-white p-7 rounded-xl shadow mb-7">
            <div className="card-header flex justify-between items-center border-b pb-4 mb-5">
              <h2 className="card-title flex items-center gap-2 text-lg font-semibold">
                <i className="fas fa-sliders-h"></i> General Settings
              </h2>
            </div>
            <div className="card-content grid gap-6">
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Application Name</label>
                <input type="text" className="form-control w-full p-3 border rounded-md" defaultValue="HRMS Admin Panel" />
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Time Zone</label>
                <select className="form-control w-full p-3 border rounded-md">
                  <option>(UTC+00:00) London</option>
                  <option>(UTC-05:00) New York</option>
                  <option selected>(UTC-08:00) Pacific Time</option>
                  <option>(UTC+01:00) Paris</option>
                  <option>(UTC+08:00) Singapore</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Date Format</label>
                <select className="form-control w-full p-3 border rounded-md">
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option selected>YYYY-MM-DD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Default Language</label>
                <select className="form-control w-full p-3 border rounded-md">
                  <option selected>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="card bg-white p-7 rounded-xl shadow mb-7">
            <div className="card-header flex justify-between items-center border-b pb-4 mb-5">
              <h2 className="card-title flex items-center gap-2 text-lg font-semibold">
                <i className="fas fa-shield-alt"></i> Security Settings
              </h2>
            </div>
            <div className="card-content grid gap-6">
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Password Policy</label>
                <select className="form-control w-full p-3 border rounded-md">
                  <option>Low (6+ characters)</option>
                  <option selected>Medium (8+ characters with letters and numbers)</option>
                  <option>High (12+ characters with mixed case, numbers and symbols)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Session Timeout</label>
                <select className="form-control w-full p-3 border rounded-md">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option selected>1 hour</option>
                  <option>4 hours</option>
                  <option>Never</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Two-Factor Authentication</label>
                <select className="form-control w-full p-3 border rounded-md">
                  <option selected>Disabled</option>
                  <option>Optional</option>
                  <option>Required for Admins</option>
                  <option>Required for All Users</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Login Attempts</label>
                <input type="number" className="form-control w-full p-3 border rounded-md" defaultValue={5} />
                <div className="text-sm text-gray-500 mt-1">Number of failed login attempts before account lockout</div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === "maintenance" && (
          <div className="card bg-white p-7 rounded-xl shadow mb-7">
            <div className="card-header flex justify-between items-center border-b pb-4 mb-5">
              <h2 className="card-title flex items-center gap-2 text-lg font-semibold">
                <i className="fas fa-tools"></i> Maintenance
              </h2>
            </div>
            <div className="card-content grid gap-6">
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">System Status</label>
                <select className="form-control w-full p-3 border rounded-md">
                  <option selected>Online</option>
                  <option>Maintenance Mode</option>
                  <option>Offline</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Clear Cache</label>
                <button className="btn btn-secondary px-5 py-3 bg-gray-100 text-gray-700 border rounded-lg flex items-center gap-2">
                  <i className="fas fa-broom"></i> Clear Application Cache
                </button>
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">Database Backup</label>
                <button className="btn btn-secondary px-5 py-3 bg-gray-100 text-gray-700 border rounded-lg flex items-center gap-2">
                  <i className="fas fa-database"></i> Create Backup
                </button>
              </div>
              <div className="form-group">
                <label className="form-label font-medium mb-2 block">System Update</label>
                <div className="mb-2"><span className="info-value">Current Version: 1.0.2</span></div>
                <button className="btn btn-primary px-5 py-3 bg-indigo-600 text-white rounded-lg flex items-center gap-2">
                  <i className="fas fa-cloud-download-alt"></i> Check for Updates
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification fixed top-5 right-5 px-5 py-3 rounded-lg text-white flex items-center gap-2 shadow ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          <i className="fas fa-check-circle"></i>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
