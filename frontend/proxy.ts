import { updateSession } from "@/lib/supabase/proxy";
import { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  console.warn('proxy:');
  return updateSession(request);
}

export const config = {
  matcher: [
    "/company/:path*",
    "/student/:path*",
  ]
}