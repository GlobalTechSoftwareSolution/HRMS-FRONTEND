
// app/unauthorized/page.tsx
import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-black">Access Denied</h1>
      <p className="text-gray-700 mb-6">You don’t have permission to access this page.</p>
      <Link href="/">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Return to Dashboard
        </button>
      </Link>
    </div>
  );
}