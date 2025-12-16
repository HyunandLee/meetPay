import LogoutButton from "@/components/LogoutButton";
import { getServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

export interface LayoutProps {
  children: React.ReactNode;
}

export default async function CompanyLayout({ children }: LayoutProps) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main>
      <header className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">Company Layout</h1>
        {
          user 
          ? <LogoutButton /> 
          : <Link href="/company/login" className="bg-blue-500 text-white px-4 py-2 rounded-md">ログイン</Link>
        }
      </header>
      {children}
    </main>
  )
}