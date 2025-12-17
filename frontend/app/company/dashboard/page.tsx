import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { getServerSupabase } from "@/lib/supabase/server";
import { Company } from "./Company";

export default async function CompanyDashboard() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1>Company Dashboard</h1>
      {/* 必要なら session 情報をここで表示 */}
      <p>Session: {user?.email}</p>
      <Company />
    </div>
  );
}