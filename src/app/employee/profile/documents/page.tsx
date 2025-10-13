"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import Image from "next/image";
import { FiUpload, FiCheckCircle, FiXCircle, FiAlertCircle, FiFileText, FiFile } from "react-icons/fi";
import Docs from "@/components/docs";

interface DocumentConfigItem {
  label: string;
  acceptedTypes: string;
  maxSize: number;
}

const documentConfig: Record<string, DocumentConfigItem> = {
  tenth: { label: "10th Marksheet", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024 },
  twelth: { label: "12th Marksheet", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024 },
  resume: { label: "Resume", acceptedTypes: ".pdf,.doc,.docx", maxSize: 2 * 1024 * 1024 },
  degree: { label: "Degree Certificate", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 10 * 1024 * 1024 },
  id_proof: { label: "ID Proof", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 2 * 1024 * 1024 },
  marks_card: { label: "Marks Card", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024 },
  award: { label: "Awards & Certifications", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024 },
  certificates: { label: "Certificates", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024 },
  masters: { label: "Masters Certificate", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 10 * 1024 * 1024 },
  appointment_letter: { label: "Appointment Letter", acceptedTypes: ".pdf,.doc,.docx", maxSize: 5 * 1024 * 1024 },
  offer_letter: { label: "Offer Letter", acceptedTypes: ".pdf,.doc,.docx", maxSize: 5 * 1024 * 1024 },
  releaving_letter: { label: "Releaving Letter", acceptedTypes: ".pdf,.doc,.docx", maxSize: 5 * 1024 * 1024 },
  resignation_letter: { label: "Resignation Letter", acceptedTypes: ".pdf,.doc,.docx", maxSize: 5 * 1024 * 1024 },
  achievement_crt: { label: "Achievement Certificate", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024 },
  bonafide_crt: { label: "Bonafide Certificate", acceptedTypes: ".pdf,.jpg,.jpeg,.png", maxSize: 5 * 1024 * 1024 },
};

interface UploadedDoc {
  id: number;
  [key: string]: string | number | null;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) return <FiFile className="inline mr-2 text-blue-500" />;
  if (["pdf"].includes(ext)) return <FiFile className="inline mr-2 text-red-500" />;
  if (["doc", "docx"].includes(ext)) return <FiFileText className="inline mr-2 text-green-500" />;
  return <FiFile className="inline mr-2 text-gray-500" />;
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const email = typeof window !== "undefined" ? localStorage.getItem("user_email") || "" : "";

  // Fetch documents
  const fetchDocs = useCallback(async () => {
    if (!email) return;
    try {
      const res = await axios.get<UploadedDoc[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/get_document/${encodeURIComponent(email)}/`);
      if (res.data.length > 0) setUploadedDocs(res.data);
      else setUploadedDocs([]);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setUploadedDocs([]);
    }
  }, [email]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleFileChange = (key: string, file?: File) => {
    if (!file) {
      setFiles(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
      return;
    }
    const cfg = documentConfig[key];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!cfg.acceptedTypes.split(",").includes(ext)) {
      setError(`Invalid file type for ${cfg.label}`);
      return;
    }
    if (file.size > cfg.maxSize) {
      setError(`File too large for ${cfg.label}, max ${(cfg.maxSize / 1024 / 1024).toFixed(2)}MB`);
      return;
    }
    setFiles(prev => ({ ...prev, [key]: file }));
    setError("");
  };

  const handleRemoveFile = (key: string) => {
    setFiles(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return setError("No logged-in user");

    if (Object.keys(files).length === 0) {
      setError("Please select at least one file to upload or update.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      Object.entries(files).forEach(([key, file]) => formData.append(key, file));

      const method = "patch";
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/update_document/${encodeURIComponent(email)}/`;

      await axios({
        method,
        url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setFiles({});
      fetchDocs(); // refresh the uploaded documents
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.data) {
          const serverMsg = typeof axiosError.response.data === "string" ? axiosError.response.data : JSON.stringify(axiosError.response.data);
          setError(`Upload failed: ${serverMsg}`);
        } else {
          setError("Upload failed due to network or server error.");
        }
      } else {
        setError("Upload failed due to an unexpected error.");
      }
    } finally {
      setUploading(false);
    }
  };

  const isImageFile = (fileName: string) => {
    return /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(fileName);
  };

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewTitle("");
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900">Upload / Update Documents</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(documentConfig).map(([key, cfg]) => {
            const uploadedUrl = uploadedDocs[0]?.[key];
            const selectedFile = files[key];
            const uploadedFileName = uploadedUrl != null ? String(uploadedUrl).split("/").pop() || "" : "";
            const isImage = selectedFile
                ? isImageFile(selectedFile.name)
                : uploadedUrl
                    ? isImageFile(uploadedFileName)
                    : false;

            const previewSrc = selectedFile ? URL.createObjectURL(selectedFile) : uploadedUrl != null ? String(uploadedUrl) : null;
            const previewTitleText = selectedFile ? selectedFile.name : uploadedFileName;

            return (
              <div key={key} className="border border-gray-300 rounded-lg p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 relative">
                <label htmlFor={key} className="block mb-2 font-semibold text-gray-700">{cfg.label}</label>

                <label
                  htmlFor={`file-input-${key}`}
                  className={`flex items-center justify-center cursor-pointer rounded-md border-2 border-dashed p-6 transition-colors duration-300
                    ${selectedFile ? "border-blue-500 text-blue-600" : uploadedUrl ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"}
                  `}
                >
                  <FiUpload className="mr-3 text-xl" />
                  {selectedFile ? (
                    <span className="truncate max-w-[150px]" title={selectedFile.name}>{selectedFile.name}</span>
                  ) : uploadedUrl ? (
                    <span className="truncate max-w-[150px]" title={String(uploadedUrl)}>
                      {uploadedFileName} (Already uploaded, re-upload?)
                    </span>
                  ) : (
                    <span>Choose a file</span>
                  )}
                  <input
                    id={`file-input-${key}`}
                    type="file"
                    accept={cfg.acceptedTypes}
                    onChange={e => handleFileChange(key, e.target.files?.[0])}
                    className="hidden"
                  />
                </label>

                {(selectedFile || uploadedUrl) && (
                  <>
                    <div className="mt-3 flex items-center space-x-3">
                      {isImage && previewSrc ? (
                        <Image
                          src={previewSrc}
                          alt={previewTitleText}
                          width={80}
                          height={80}
                          className="object-cover rounded-md border border-gray-300"
                        />
                      ) : previewSrc ? getFileIcon(previewTitleText) : null}

                      <div className="flex-1 text-sm text-gray-700 truncate">
                        {selectedFile?.name || uploadedFileName}
                      </div>
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(key)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          aria-label={`Remove file for ${cfg.label}`}
                        >
                          <FiXCircle size={22} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => previewSrc && openPreview(previewSrc, previewTitleText)}
                      className="mt-2 inline-block px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none"
                    >
                      Preview
                    </button>
                  </>
                )}

                <p className="mt-1 text-xs text-gray-400">
                  Accepted types: {cfg.acceptedTypes} | Max size: {(cfg.maxSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-300 ${
            uploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <FiUpload className={uploading ? "animate-spin" : ""} />
          <span>{uploading ? "Uploading..." : "Update Documents"}</span>
        </button>

        {success && (
          <div className="flex items-center space-x-2 mt-4 text-green-700 bg-green-100 border border-green-300 rounded-md p-3">
            <FiCheckCircle className="text-2xl" />
            <p className="font-medium">Documents updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 mt-4 text-red-700 bg-red-100 border border-red-300 rounded-md p-3">
            <FiAlertCircle className="text-2xl" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </form>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="preview-title" className="text-xl font-semibold mb-4">{previewTitle}</h2>
            <button
              onClick={closePreview}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Close preview"
            >
              <FiXCircle size={28} />
            </button>
            {/\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(previewUrl) ? (
              <Image src={previewUrl} alt={previewTitle} width={800} height={800} className="object-contain max-h-[80vh]" />
            ) : /\.(pdf)$/i.test(previewUrl) ? (
              <iframe src={previewUrl} title={previewTitle} className="w-full h-[80vh]" />
            ) : (
              <div className="p-4 text-gray-700">
                <p>Preview not available for this file type.</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mt-2 block">Open in new tab</a>
              </div>
            )}
          </div>
        </div>
      )}

      <Docs />
    </div>
  );
}