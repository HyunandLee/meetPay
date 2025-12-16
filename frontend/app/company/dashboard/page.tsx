import { getServerSupabase } from "@/lib/supabase/server";

export default async function CompanyDashboard() {
  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("session:", session);

  return (
    <div>
      <h1>Company Dashboard</h1>
      {/* 必要なら session 情報をここで表示 */}
      <p>Session: {session?.user?.email}</p>
    </div>
  );
}