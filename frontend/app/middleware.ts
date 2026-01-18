import { updateSession } from "@/lib/supabase/proxy";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/company/:path*",
    "/student/:path*",
  ]
}