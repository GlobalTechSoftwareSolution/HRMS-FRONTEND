"use client";
import { ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";

type Role = "ceo" | "manager" | "hr" | "employee" | "admin";

type Props = {
  children: ReactNode;
  role: Role;
};

type UserInfo = {
  name?: string;
  email?: string;
  picture?: string; // Google profile photo URL
  profile_profile_picture?: string; // backend profile pic
  role?: string;
};

// Map role links with display name and actual path
const roleLinksMap: Record<Role, { name: string; path: string }[]> = {
  ceo: [
    { name: "Overview", path: "/ceo/overview" },
    { name: "Reports", path: "/ceo/reports" },
    { name: "Employees", path: "/ceo/employees" },
    { name: "Finance", path: "/ceo/finance" },
    { name: "Projects", path: "/ceo/projects" },
    { name: "Notice", path: "/ceo/notice" },
    { name: "Profile", path: "/ceo/profile" },
  ],
  manager: [
    { name: "Tasks", path: "/manager/tasks" },
    { name: "Reports", path: "/manager/reports" },
    { name: "Team", path: "/manager/team" },
    { name: "LeaveApprovals", path: "/manager/leaveapprovals" },
    { name: "Attendence", path: "/manager/attendence" },
    { name: "Profile", path: "/manager/profile" },
  ],
  hr: [
    { name: "Employees", path: "/hr/employee" },
    { name: "Leaves", path: "/hr/leaves" },
    { name: "Attendance", path: "/hr/attendance" },
    { name: "Payroll", path: "/hr/payroll" },
    { name: "Onboarding", path: "/hr/onboardinng" },
    { name: "Offboarding", path: "/hr/offboardinng" },
    { name: "Profile", path: "/hr/profile" },
  ],
  employee: [
    { name: "Dashboard", path: "/employee/dashboard" },
    { name: "Tasks", path: "/employee/tasks" },
    { name: "Attendance", path: "/employee/attendance" },
    { name: "Leaves", path: "/employee/leaves" },
    { name: "Payroll", path: "/employee/payroll" },
    { name: "Profile", path: "/employee/profile" },
  ],
  admin: [
    { name: "Approvals", path: "/admin/approvals" },
    { name: "System Settings", path: "/admin/system-settings" },
    { name: "Profile", path: "/admin/profile" },
  ],
};

export default function DashboardLayout({ children, role }: Props) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Role protection
  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    let currentRole: string | null = null;

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        currentRole = parsedUser.role;
      } catch {
        currentRole = null;
      }
    }

    if (!currentRole) {
      const match = document.cookie.match(new RegExp("(^| )role=([^;]+)"));
      if (match) currentRole = decodeURIComponent(match[2]);
    }

    if (!currentRole) {
      router.replace("/login");
    } else if (currentRole !== role) {
      router.replace("/unauthorized");
    }
  }, [role, router]);

  // ✅ Fetch user data from backend
  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      const email = parsedUser.email;

      const fetchUser = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}api/accounts/${role}s/${email}/`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (!res.ok) throw new Error("Failed to fetch user data");

          const data = await res.json();
          setUserInfo({
            name: data.fullname,
            email: data.email,
            picture: parsedUser.picture, // Google pic (if any)
            profile_profile_picture: data.profile_picture, // backend pic
            role: parsedUser.role,
          });
        } catch (error) {
          console.error("Error fetching user:", error);
          setUserInfo(parsedUser); // fallback to localStorage
        }
      };

      fetchUser();
    } catch {
      setUserInfo(null);
    }
  }, [role]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.replace("/login");
  }, [router]);

  const roleLinks = roleLinksMap[role];

  const profilePic =
    userInfo?.profile_profile_picture ||
    userInfo?.picture ||
    "/default-profile.png";

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-72 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg flex-col">
        <div className="p-6 flex items-center gap-4 border-b border-blue-700">
          <img
            src={profilePic}
            alt={userInfo?.name || "Profile"}
            className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover"
          />
          <div className="flex flex-col">
            <p className="text-lg font-semibold text-white">
              {userInfo?.name || "Guest User"}
            </p>
            <p className="text-sm text-blue-200">{role.toUpperCase()}</p>
          </div>
        </div>

        <nav className="flex flex-col p-4 space-y-2">
          {roleLinks?.map((link) => (
            <Link
              href={link.path}
              key={link.name}
              className="px-4 py-2 rounded-lg hover:bg-blue-500 hover:shadow-md transition-all font-medium"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-all"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative w-72 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg flex flex-col z-40">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <FiX size={24} />
            </button>

            <div className="p-6 flex items-center gap-4 border-b border-blue-700">
              <img
                src={profilePic}
                alt={userInfo?.name || "Profile"}
                className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover"
              />
              <div className="flex flex-col">
                <p className="text-lg font-semibold text-white">
                  {userInfo?.name || "Guest User"}
                </p>
                <p className="text-sm text-blue-200">{role.toUpperCase()}</p>
              </div>
            </div>

            <nav className="flex flex-col p-4 space-y-2">
              {roleLinks?.map((link) => (
                <Link
                  href={link.path}
                  key={link.name}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2 rounded-lg hover:bg-blue-500 hover:shadow-md transition-all font-medium"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="mt-auto p-4">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-all"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow-md p-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-blue-700"
            >
              <FiMenu size={24} />
            </button>
            <h2 className="text-2xl font-semibold text-blue-700 tracking-wide">
              {role.toUpperCase()} Dashboard
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => router.push(`/${role}/profile`)}
              className="focus:outline-none"
            >
              <img
                src={profilePic}
                alt={userInfo?.name || "Profile"}
                className="w-10 h-10 rounded-full border border-gray-300 shadow-sm object-cover cursor-pointer"
              />
            </button>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
