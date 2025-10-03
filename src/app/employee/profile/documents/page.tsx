"use client";

import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { 
  FiUpload, 
  FiFile, 
  FiCheck, 
  FiX, 
  FiAlertCircle,
  FiEye,
  FiTrash2
} from "react-icons/fi";

interface DocumentConfigItem {
  label: string;
  description: string;
  acceptedTypes: string;
  maxSize: number;
  required: boolean;
}

const documentConfig: Record<string, DocumentConfigItem> = {
  tenth: { label: "10th Marksheet", description: "Upload your 10th standard marksheet", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024, required: true },
  twelth: { label: "12th Marksheet", description: "Upload your 12th standard marksheet", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024, required: true },
  resume: { label: "Resume", description: "Upload your latest resume", acceptedTypes: ".pdf,.doc,.docx", maxSize: 2 * 1024 * 1024, required: true },
  degree: { label: "Degree Certificate", description: "Upload your degree certificate", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 10 * 1024 * 1024, required: true },
  id_proof: { label: "ID Proof", description: "Upload government issued ID proof", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 2 * 1024 * 1024, required: true },
  marks_card: { label: "Marks Card", description: "Upload your university marks card", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024, required: false },
  award: { label: "Awards & Certifications", description: "Upload any awards or certifications", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024, required: false },
};

interface UploadStatus {
  status: "idle" | "selected" | "uploading" | "error";
  message?: string;
}

interface UploadedDoc {
  id: number;
  document: string;
  [key: string]: string | number | null | undefined; // safer instead of any
}

const DocumentsPage = () => {
  const email = "mani@gmail.com";
  const [files, setFiles] = useState<Record<string, File>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatus>>({});
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  // Fetch documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axios.get<UploadedDoc[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_documents/`,
          { params: { email } }
        );
        setUploadedDocs(res.data || []);
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };
    fetchDocs();
  }, []);

  const handleFileChange = (key: string, file: File | undefined) => {
    if (!file) {
      setFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[key];
        return newFiles;
      });
      setUploadStatus(prev => ({ ...prev, [key]: { status: "idle" } }));
      return;
    }

    const config = documentConfig[key];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const acceptedTypes = config.acceptedTypes.split(",");

    if (!acceptedTypes.some(type => fileExtension === type)) {
      setUploadStatus(prev => ({
        ...prev,
        [key]: { status: "error", message: `Invalid file type. Accepted: ${config.acceptedTypes}` }
      }));
      return;
    }

    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      setUploadStatus(prev => ({
        ...prev,
        [key]: { status: "error", message: `File too large. Max size: ${maxSizeMB}MB` }
      }));
      return;
    }

    setFiles(prev => ({ ...prev, [key]: file }));
    setUploadStatus(prev => ({
      ...prev,
      [key]: { status: "selected", message: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)` }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError("");
    setSuccess(false);

    const missingRequired = Object.entries(documentConfig)
      .filter(([key, config]) => config.required && !files[key])
      .map(([key]) => documentConfig[key].label);

    if (missingRequired.length > 0) {
      setError(`Missing required documents: ${missingRequired.join(", ")}`);
      setUploading(false);
      return;
    }

    const totalSize = Object.values(files).reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      setError("Total file size exceeds 20MB. Please remove some files.");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      Object.keys(files).forEach((key) => {
        if (files[key]) formData.append(key, files[key]);
      });

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_document/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }
      );

      setSuccess(true);

      const res = await axios.get<UploadedDoc[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_documents/?email=${encodeURIComponent(email)}`
      );
      setUploadedDocs(res.data || []);

      setTimeout(() => {
        setFiles({});
        setUploadStatus({});
        setSuccess(false);
      }, 3000);

    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosErr.response?.data?.message
        || axiosErr.message
        || "Upload failed. Please try again.";
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (key: string) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[key];
      return newFiles;
    });
    setUploadStatus(prev => ({ ...prev, [key]: { status: "idle" } }));
  };

  const deleteUploadedDoc = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/delete_document/${id}/`);
      setUploadedDocs(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete document.");
    }
  };

  const getStatusIcon = (status: UploadStatus["status"]) => {
    switch (status) {
      case "selected": return <FiCheck className="text-green-500" />;
      case "uploading": return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
      case "error": return <FiX className="text-red-500" />;
      default: return <FiFile className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: UploadStatus["status"]) => {
    switch (status) {
      case "selected": return "border-green-200 bg-green-50";
      case "error": return "border-red-200 bg-red-50";
      case "uploading": return "border-blue-200 bg-blue-50";
      default: return "border-gray-200 bg-white";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-black">
      {/* Header */}
      <Link
        href="/employee/profile"
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        ← Back
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Upload</h1>
        <p className="text-gray-600">Upload your required documents. Required documents are marked with an asterisk (*).</p>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(documentConfig).map(([key, config]) => (
            <div key={key} className={`border-2 rounded-lg p-4 ${getStatusColor(uploadStatus[key]?.status || "idle")}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {config.label}{config.required && <span className="text-red-500">*</span>}
                    {uploadStatus[key]?.status && getStatusIcon(uploadStatus[key].status)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                </div>
                {files[key] && (
                  <button type="button" onClick={() => removeFile(key)} className="text-red-500 hover:text-red-700 ml-2">
                    <FiX size={18} />
                  </button>
                )}
              </div>
              {uploadStatus[key]?.message && (
                <div className={`text-sm mb-3 ${uploadStatus[key]?.status === "error" ? "text-red-600" : "text-green-600"}`}>
                  {uploadStatus[key].message}
                </div>
              )}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-white">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center">
                    <span className="font-medium text-blue-600">Click to upload</span><br />or drag and drop
                  </p>
                </div>
                <input type="file" className="hidden" accept={config.acceptedTypes} onChange={(e) => handleFileChange(key, e.target.files?.[0])} />
              </label>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t">
          <button type="button" onClick={() => { setFiles({}); setUploadStatus({}); setError(""); setSuccess(false); }} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50" disabled={uploading}>
            Clear All
          </button>
          <button type="submit" disabled={uploading || Object.keys(files).length === 0} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {uploading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Uploading...</> : <><FiUpload size={18} /> Upload Documents</>}
          </button>
        </div>

        {/* Messages */}
        {success && <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg"><FiCheck className="text-green-500" /><span className="text-green-700">Documents uploaded successfully!</span></div>}
        {error && <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg"><FiAlertCircle className="text-red-500" /><span className="text-red-700">{error}</span></div>}
      </form>

      {/* Uploaded Documents */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Uploaded Documents</h2>
        {uploadedDocs.length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {uploadedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <span className="text-gray-700 font-medium">
                  {doc.document ? doc.document.split("/").pop() : "Unnamed Document"}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.open(doc.document, "_blank")} className="text-blue-600 hover:text-blue-800"><FiEye size={18} /></button>
                  <button onClick={() => deleteUploadedDoc(doc.id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
