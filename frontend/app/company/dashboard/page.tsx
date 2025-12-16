import { getServerSupabase } from "@/lib/supabase/server";

export default async function CompanyDashboard() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // console.log("session:", session);

  return (
    <div>
      <h1>Company Dashboard</h1>
      {/* 必要なら session 情報をここで表示 */}
      <p>Session: {user?.email}</p>
    </div>
  );
}