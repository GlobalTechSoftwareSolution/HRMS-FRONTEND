"use client";
import { ReactNode, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "ceo" | "manager" | "hr" | "employee" | "admin";

type Props = {
  children: ReactNode;
  role: Role;
};

export default function DashboardLayout({ children, role }: Props) {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/");
  }, [router]);

  const links: Record<Role, string[]> = {
    ceo: ["Overview", "Reports", "Employees"],
    manager: ["Team", "Tasks", "Reports"],
    hr: ["Employees", "Payroll", "Leaves"],
    employee: ["Profile", "Tasks", "Attendance"],
    admin: ["User Management", "System Settings", "Logs"],
  };

  const roleLinks = links[role] ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg flex flex-col">
        <div className="p-6 font-bold text-2xl tracking-wide border-b border-blue-700">
          {role.toUpperCase()} Dashboard
        </div>
        <nav className="flex flex-col p-4 space-y-3">
          {roleLinks.map((link) => (
            <Link
              href={`#${link.toLowerCase()}`}
              key={link}
              className="px-4 py-2 rounded-md hover:bg-blue-500 font-semibold transition-colors duration-200"
            >
              {link}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-blue-700">{role.toUpperCase()}</h2>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}