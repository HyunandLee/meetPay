import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "./database.types";

export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // CookieMethodsServer の新しいシグネチャ（getAll / setAll）に合わせる
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // console.error('Error:', error);
          }
        },
      },
    }
  );
}