import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "./database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  })
  console.log('supabaseResponse:', supabaseResponse);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request
          })
          cookiesToSet.forEach(({ name, value, options}) => supabaseResponse.cookies.set(name, value, options))
        }
      },
    }
  )

  const url = request.nextUrl.clone();
  try {
    const { data } = await supabase.auth.getClaims()
    // console.log('data:', data);

    const user = data?.claims?.user;
    if (!user) {
      if (url.pathname.startsWith("/company")) {
        url.pathname = "/company/login";
      } else if (url.pathname.startsWith("/student")) {
        url.pathname = "/student/login";
      }
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  } catch (error) {
    // delete cookies
    await supabase.auth.signOut();

    if (url.pathname.startsWith("/company")) {
      url.pathname = "/company/login";
    } else if (url.pathname.startsWith("/student")) {
      url.pathname = "/student/login";
    }
    return NextResponse.redirect(url);
  }
}