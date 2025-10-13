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
    const documentsData: unknown[] = await docRes.json();

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

    documentsData.forEach((doc) => {
      // Ensure doc is an object
      if (typeof doc !== "object" || doc === null) return;

      // Type doc as a record with string keys and string | number | null values
      const recordDoc = doc as Record<string, string | number | null>;

      // Ensure email exists and is a string or number or null
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

    console.log("Normalized Documents for current user:", normalizedDocs);

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
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
     

        {/* Right: Documents */}
      <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
  <h1 className="text-2xl font-bold text-gray-900 mb-4">Documents uploaded</h1>

  {userDocs.length > 0 ? (
    <ul className="space-y-3 max-h-96 overflow-y-auto">
      {userDocs.map((doc) => (
        <li key={`${doc.id}-${doc.document_name}`}>
          {doc.document_url ? (
            <div
              onClick={() => setPreviewUrl(doc.document_url)}
              className="cursor-pointer block p-3 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium shadow-sm transition select-none"
            >
              📄 {doc.document_name}
            </div>
          ) : (
            <div className="block p-3 rounded-md bg-gray-100 text-gray-500 font-medium select-none">
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
        className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] p-4 relative overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setPreviewUrl(null)}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 font-bold text-xl"
          aria-label="Close preview"
        >
          &times;
        </button>
        {previewUrl.match(/\.(jpeg|jpg|png)$/i) ? (
          <Image
            src={previewUrl}
            alt="Document Preview"
            layout="fill"
            objectFit="contain"
            className="rounded"
            unoptimized
            onError={() => setPreviewUrl("/default-document.png")}
          />
        ) : previewUrl.match(/\.(pdf)$/i) ? (
          <iframe
            src={previewUrl}
            title="Document Preview"
            className="w-full h-[75vh]"
            frameBorder="0"
            onError={() => setPreviewUrl(null)}
          />
        ) : (
          <div className="w-full h-[75vh] flex items-center justify-center">
            <p className="text-center text-red-500">
              Cannot preview this document. You can download it instead.
            </p>
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