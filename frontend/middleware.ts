import { NextRequest, NextResponse } from "next/server";

const roleHome: Record<string, string> = {
  super_admin: "/dashboard/admin/institutes",
  institute_admin: "/dashboard/institute-admin/users",
  teacher: "/dashboard/teacher/batches",
  student: "/dashboard/student/courses"
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("lms_token")?.value;
  const role = request.cookies.get("lms_role")?.value;

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (pathname === "/dashboard" && role && roleHome[role]) {
      return NextResponse.redirect(new URL(roleHome[role], request.url));
    }
    if (pathname.startsWith("/dashboard/admin") && role !== "super_admin") {
      return NextResponse.redirect(new URL(roleHome[role ?? "student"] ?? "/login", request.url));
    }
    if (pathname.startsWith("/dashboard/institute-admin") && role !== "institute_admin") {
      return NextResponse.redirect(new URL(roleHome[role ?? "student"] ?? "/login", request.url));
    }
    if (pathname.startsWith("/dashboard/teacher") && role !== "teacher") {
      return NextResponse.redirect(new URL(roleHome[role ?? "student"] ?? "/login", request.url));
    }
    if (pathname.startsWith("/dashboard/student") && role !== "student") {
      return NextResponse.redirect(new URL(roleHome[role ?? "student"] ?? "/login", request.url));
    }
  }

  if ((pathname === "/login" || pathname === "/register") && token && role && roleHome[role]) {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"]
};
