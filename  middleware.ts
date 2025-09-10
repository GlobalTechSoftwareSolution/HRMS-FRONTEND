// /middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes: Record<string, string[]> = {
  ceo: ["/ceo", "/overview", "/reports", "/employees"],
  manager: ["/manager", "/team", "/tasks", "/reports"],
  hr: ["/hr", "/hr/employees", "/hr/leaves", "/hr/attendance", "/hr/payroll", "/hr/tasks"],
  employee: ["/employee", "/employee/dashboard", "/employee/tasks", "/employee/attendance", 
             "/employee/leaves", "/employee/payroll", "/employee/profile"],
  admin: ["/admin", "/admin/users", "/admin/settings", "/admin/logs"],
};

const roleHierarchy: Record<string, number> = {
  employee: 1,
  hr: 2,
  manager: 3,
  admin: 4,
  ceo: 5,
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;
  const { pathname } = req.nextUrl;

  // Public routes
  if (["/", "/login", "/signup"].some(path => pathname.startsWith(path)) || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Check for protected route
  const matchedRoleEntry = Object.entries(protectedRoutes).find(([_, routes]) =>
    routes.some(route => pathname.startsWith(route))
  );

  if (matchedRoleEntry) {
    const [requiredRole] = matchedRoleEntry;

    // No token → redirect to login
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    // Role mismatch → redirect to unauthorized
    if (!role || (role !== requiredRole && roleHierarchy[role] < roleHierarchy[requiredRole])) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ceo/:path*", "/manager/:path*", "/hr/:path*", "/employee/:path*", "/admin/:path*"],
};