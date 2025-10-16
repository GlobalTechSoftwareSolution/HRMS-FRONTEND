"use client";
import { ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

const roleLinksMap: Record<Role, { name: string; path: string }[]> = {
  ceo: [
   { name: "Dashboard", path: "/ceo/dashboard" },
    { name: "Reports", path: "/ceo/reports" },
    { name: "Employees", path: "/ceo/employees" },
    { name: "Attendence", path: "/ceo/attendence" },
    { name: "Finance", path: "/ceo/finance" },
    { name: "Projects", path: "/ceo/projects" },
    { name: "Notice", path: "/ceo/notice" },
    { name: "Calender", path: "/ceo/calender" },
    { name: "Tickets", path: "/ceo/ceo_tickets" },
    { name: "Profile", path: "/ceo/profile" },
  ],
  manager: [
    { name: "Tasks", path: "/manager/tasks" },
    { name: "Reports", path: "/manager/reports" },
    { name: "Team", path: "/manager/team" },
    { name: "LeaveApprovals", path: "/manager/leaveapprovals" },
    { name: "Attendence", path: "/manager/attendence" },
    { name: "Notice", path: "/manager/notice" },
    { name: "Calender", path: "/manager/calender" },
    { name: "Tickets", path: "/manager/manager_tickets" },
    { name: "Profile", path: "/manager/profile" },
  ],
  hr: [
    { name: "Employees", path: "/hr/employee" },
    { name: "Leaves", path: "/hr/leaves" },
    { name: "Attendance", path: "/hr/attendance" },
    { name: "Payroll", path: "/hr/payroll" },
    { name: "Onboarding", path: "/hr/onboardinng" },
    { name: "Offboarding", path: "/hr/offboardinng" },
    { name: "Calender", path: "/hr/calender" },
    { name: "Notice", path: "/hr/notice" },
    { name: "Tickets", path: "/hr/hr_tickets" },
    { name: "Documents", path: "/hr/documents" },
    { name: "Profile", path: "/hr/profile" },
  ],
  employee: [
    { name: "Dashboard", path: "/employee/dashboard" },
    { name: "Tasks", path: "/employee/tasks" },
    { name: "Attendance", path: "/employee/attendance" },
    { name: "Leaves", path: "/employee/leaves" },
    { name: "Payroll", path: "/employee/payroll" },
    { name: "Calender", path: "/employee/calender" },
    { name: "Notice", path: "/employee/notice" },
    { name: "KRA & KPA", path: "/employee/Kra&Kpa" },
    { name: "Tickets", path: "/employee/employee_tickets" },
    { name: "Profile", path: "/employee/profile" },
    
  ],
  admin: [
    { name: "Attendence", path: "/admin/attendence" },
    { name: "Approvals", path: "/admin/approvals" },
    { name: "System Settings", path: "/admin/system-settings" },
    { name: "Calender", path: "/admin/calender" },
    { name: "Notice", path: "/admin/notice" },
    { name: "Tickets", path: "/admin/admin_tickets" },
    { name: "Profile", path: "/admin/profile" },

  ],
};

export default function DashboardLayout({ children, role }: Props) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Track current path for active link highlighting (survive SSR, refresh, and mobile)
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, [router.asPath]);

  // Load user info from localStorage & listen for updates
  useEffect(() => {
    const loadUserInfo = () => {
      const storedUser = localStorage.getItem("userInfo");
      if (!storedUser) {
        router.replace("/login"); // redirect to login if not logged in
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUserInfo({
          name: parsedUser.name || "Guest User",
          email: parsedUser.email || "",
          picture: parsedUser.picture || "/default-profile.png",
          profile_profile_picture: parsedUser.profile_profile_picture || "",
          role: parsedUser.role || role.toUpperCase(),
        });
      } catch (error) {
        console.error("Error parsing stored user info:", error);
        router.replace("/login"); // redirect if parsing fails
      }
    };

    loadUserInfo();
    window.addEventListener("profile-updated", loadUserInfo);
    return () => window.removeEventListener("profile-updated", loadUserInfo);
  }, [role, router]);

  // Fetch updated user data from backend
  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      const email = parsedUser.email;

      const fetchUser = async () => {
        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${role}s/${encodeURIComponent(email)}/`;
          const res = await fetch(url);
          if (!res.ok) {
            console.warn("Failed to fetch user data. Status:", res.status);
            setUserInfo(parsedUser);
            return;
          }
          const data = await res.json();
          setUserInfo({
            name: data.fullname || parsedUser.name,
            email: data.email,
            picture: parsedUser.picture,
            profile_profile_picture: data.profile_picture,
            role: parsedUser.role,
          });
        } catch (error) {
          console.error("Error fetching user:", error);
          setUserInfo(parsedUser);
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
    router.replace("/");
  }, [router]);

  const roleLinks = roleLinksMap[role];
  const profilePic =
    userInfo?.profile_profile_picture || userInfo?.picture || "/default-profile.png";

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-72 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg flex-col z-20">
        <div className="p-6 flex items-center gap-4 border-b border-blue-700">
          <Image
            src={profilePic}
            alt={userInfo?.name || "Profile"}
            width={64}
            height={64}
            unoptimized
            className="rounded-full border-2 border-white shadow-md object-cover w-16 h-16"
          />
          <div className="flex flex-col">
            <p className="text-lg font-semibold text-white">
              {userInfo?.name || "Guest User"}
            </p>
            <p className="text-sm text-blue-200">{role.toUpperCase()}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col p-4 space-y-2">
          {roleLinks?.map((link) => (
            <Link
              href={link.path}
              key={link.name}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                currentPath.startsWith(link.path) ? "bg-blue-500 shadow-md" : "hover:bg-blue-500 hover:shadow-md"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-blue-800">
          <button
            onClick={() => setLogoutModalOpen(true)}
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
          <div className="relative w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg flex flex-col z-40">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-3 right-3 text-white"
            >
              <FiX size={24} />
            </button>

            <div className="p-4 flex flex-col items-center gap-2 border-b border-blue-700">
              <Image
                src={profilePic}
                alt={userInfo?.name || "Profile"}
                width={56}
                height={56}
                unoptimized
                className="rounded-full border-2 border-white shadow-md object-cover w-14 h-14"
              />
              <div className="text-center">
                <p className="text-md font-semibold text-white break-words">{userInfo?.name || "Guest"}</p>
                <p className="text-xs text-blue-200 uppercase break-words">{role.toUpperCase()}</p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto flex flex-col p-2 space-y-1">
              {roleLinks?.map((link) => (
                <Link
                  href={link.path}
                  key={link.name}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg transition-all font-medium text-sm truncate ${
                    currentPath.startsWith(link.path) ? "bg-blue-500 shadow-md" : "hover:bg-blue-500 hover:shadow-md"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="sticky bottom-0 p-3 bg-gradient-to-t from-blue-800">
              <button
                onClick={() => {
                  setLogoutModalOpen(true);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg font-semibold text-sm transition-all"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Are you sure you want to logout?</h3>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setLogoutModalOpen(false);
                  handleLogout();
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col ml-0 md:ml-72">
        <header className="fixed top-0 left-0 right-0 md:left-72 bg-white shadow-md p-4 flex justify-between items-center border-b border-gray-200 sticky z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(prev => !prev)}
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
              <Image
                src={profilePic}
                alt={userInfo?.name || "Profile"}
                width={40}
                height={40}
                unoptimized
                className="rounded-full border border-gray-300 shadow-md object-cover w-10 h-10 cursor-pointer"
              />
            </button>
          </div>
        </header>

        <div className="pt-20 p-6 flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}