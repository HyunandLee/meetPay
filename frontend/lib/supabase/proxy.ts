import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "./database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  })

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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // すでにログインページや登録ページにいる場合はリダイレクトしない
      if (url.pathname === "/company/login" || url.pathname === "/company/register") {
        return supabaseResponse;
      }
      if (url.pathname === "/student/login" || url.pathname === "/student/signup") {
        return supabaseResponse;
      }
      
      // ログインページにリダイレクト
      if (url.pathname.startsWith("/company")) {
        url.pathname = "/company/login";
      } else if (url.pathname.startsWith("/student")) {
        url.pathname = "/student/login";
      }
      return NextResponse.redirect(url);
    }

    // 1. url.pathname ends with "/login" -> redirect to "/dashboard"
    console.log('url.pathname:', url.pathname);
    if (url.pathname.endsWith("/login")) {
      url.pathname = url.pathname.replace("/login", "/dashboard");
      return NextResponse.redirect(url);
    }

    // // 2. url.pathname ends with "/register" -> redirect to "/dashboard"
    // if (url.pathname.endsWith("/register")) {
    //   url.pathname = url.pathname.replace("/register", "/dashboard");
    //   return NextResponse.redirect(url);
    // }

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