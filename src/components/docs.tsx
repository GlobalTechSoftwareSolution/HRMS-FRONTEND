import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface Employee {
  fullname?: string
  profile_picture_url?: string
  designation?: string
  department?: string
  email: string
  phone?: string
  employment_type?: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_no?: string
  documents?: DocumentItem[]
}

interface DocumentItem {
  id: number
  employee_email: string
  document_name: string
  document_url: string
}

const Docs = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

 const fetchData = async () => {
  try {
    const storedUser = localStorage.getItem("userInfo");
    const parsed: { email?: string } | null = storedUser ? JSON.parse(storedUser) : null;
    const userEmail = parsed?.email;

    if (!userEmail) throw new Error("No logged-in user found");

    const [empRes, docRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/${encodeURIComponent(userEmail)}/`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_documents/`),
    ]);

    if (!empRes.ok || !docRes.ok) throw new Error("Failed to fetch data");

    const employeeData: Employee = await empRes.json();
    const documentsData: unknown = await docRes.json();
    const docsArray: unknown[] = Array.isArray(documentsData) ? documentsData : (((documentsData as Record<string, unknown>)?.data as unknown[]) || ((documentsData as Record<string, unknown>)?.documents as unknown[]) || []);

    // Merge all documents for current user
    const normalizedDocs: DocumentItem[] = [];
    const fileFields = [
      "tenth", "twelth", "degree", "masters", "marks_card",
      "certificates", "award", "resume", "id_proof",
      "appointment_letter", "offer_letter", "releaving_letter",
      "resignation_letter", "achievement_crt", "bonafide_crt",
    ];

    const documentLabelMap: { [key: string]: string } = {
      tenth: "10th Marksheet",
      twelth: "12th Marksheet",
      degree: "Degree Certificate",
      masters: "Masters Certificate",
      marks_card: "Marks Card",
      certificates: "Certificates",
      award: "Awards",
      resume: "Resume",
      id_proof: "ID Proof",
      appointment_letter: "Appointment Letter",
      offer_letter: "Offer Letter",
      releaving_letter: "Releaving Letter",
      resignation_letter: "Resignation Letter",
      achievement_crt: "Achievement Certificate",
      bonafide_crt: "Bonafide Certificate",
    };

    docsArray.forEach((doc: unknown) => {
      if (typeof doc !== "object" || doc === null) return;
      const recordDoc = doc as Record<string, string | number | null>;
      if (typeof recordDoc.email !== "string" && typeof recordDoc.email !== "number") return;
      if (String(recordDoc.email).toLowerCase() !== userEmail.toLowerCase()) return;

      fileFields.forEach((field) => {
        const url = recordDoc[field];
        if (typeof url === "string" && url.trim()) {
          normalizedDocs.push({
            id: Number(recordDoc.id),
            employee_email: String(recordDoc.email),
            document_name: documentLabelMap[field] || field,
            document_url: url.trim(),
          });
        }
      });
    });

    setEmployees([{ ...employeeData, documents: normalizedDocs }]);
  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError(String(err));
    }
  } finally {
    setLoading(false);
  }
};

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[16rem]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )

  if (error)
    return (
      <div className="flex justify-center items-center min-h-[16rem]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    )

  const userDocs = employees[0]?.documents || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">

        {/* Documents Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Uploaded Documents</h1>

          {userDocs.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto">
              {userDocs.map((doc) => (
                <li key={`${doc.id}-${doc.document_name}`}>                  
                  {doc.document_url ? (
                    <div
                      onClick={() => setPreviewUrl(doc.document_url)}
                      className="cursor-pointer p-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium shadow-sm transition flex items-center gap-2 select-none"
                    >
                      📄 {doc.document_name}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-gray-100 text-gray-500 font-medium select-none">
                      {doc.document_name}: Not Uploaded
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No documents found.</p>
          )}

          {/* Preview Modal */}
          {previewUrl && (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
              onClick={() => setPreviewUrl(null)}
            >
              <div
                className="bg-white rounded-2xl w-full max-w-5xl max-h-[85vh] p-6 relative overflow-auto"
                onClick={() => {}}
              >
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-2xl"
                  aria-label="Close preview"
                >
                  &times;
                </button>
                {/\.(jpeg|jpg|png|gif|webp)$/i.test(previewUrl) ? (
                  <div className="flex justify-center items-center w-full h-[75vh] bg-gray-50 rounded">
                    <Image
                      src={previewUrl}
                      alt="Document Preview"
                      width={1000}
                      height={1000}
                      className="max-h-full max-w-full object-contain rounded"
                      onError={() => {
                        console.error("Image failed to load:", previewUrl);
                      }}
                    />
                  </div>
                ) : previewUrl.toLowerCase().endsWith(".pdf") ? (
                  <div className="relative w-full h-[75vh] rounded bg-gray-50 flex justify-center items-center">
                    <div id="pdf-loader" className="absolute flex justify-center items-center w-full h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                      title="PDF Preview"
                      className="w-full h-[75vh] rounded relative z-10"
                      frameBorder="0"
                      allowFullScreen
                      onLoad={() => {
                        const loader = document.getElementById('pdf-loader');
                        if (loader) loader.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-[75vh] bg-gray-50 rounded">
                    <p className="text-gray-600 mb-4">Unable to preview this document type.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Docs;
