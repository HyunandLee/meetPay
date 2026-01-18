import CompanyClientLayout from "@/components/company/CompanyLayoutClient";
import { getServerSupabase } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { AdminModeProvider } from "@/components/company/AdminModeContext";
import { WalletModalProvider } from "@/components/company/WalletModalContext";

export interface LayoutProps {
  children: React.ReactNode;
}

export default async function CompanyLayout({ children }: LayoutProps) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AdminModeProvider>
      <WalletModalProvider>
        <CompanyClientLayout user={user as User}>
          {children}
        </CompanyClientLayout>
      </WalletModalProvider>
    </AdminModeProvider>
  )
}