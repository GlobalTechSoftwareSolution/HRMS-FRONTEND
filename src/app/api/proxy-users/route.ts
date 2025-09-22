// app/api/proxy-users/route.ts
import { NextResponse } from "next/server";

type User = {
  id: number;
  email: string;
  fullname: string;
  role?: string;
  is_staff: boolean;
  phone?: string;
  department?: string;
  profile_picture?: string;
};

export async function GET() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!apiBase) {
      return NextResponse.json(
        { error: "API base URL not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(`${apiBase}/accounts/users`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream server error" },
        { status: res.status }
      );
    }

    const data: User[] = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    // Type-safe error handling
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
