// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const path = req.nextUrl.pathname;

  // === 保護対象のルート ===
  const studentProtected = ["/student/dashboard", "/student/profile"];
  const companyProtected = [
    "/company/dashboard",
    "/company/profile",
    "/company/offer-send",
    "/company/offers",
  ];

  // --- 学生保護ページ ---
  if (studentProtected.some((p) => path.startsWith(p))) {
    if (!user || user.user_metadata.role !== "student") {
      return NextResponse.redirect(new URL("/student/login", req.url));
    }
  }

  // --- 企業保護ページ ---
  if (companyProtected.some((p) => path.startsWith(p))) {
    if (!user || user.user_metadata.role !== "company") {
      return NextResponse.redirect(new URL("/company/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/company/:path*",
  ],
};
