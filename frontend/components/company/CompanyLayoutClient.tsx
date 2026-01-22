"use client";

import LogoutButton from "@/components/LogoutButton";
import { useModal } from "./WalletModalContext";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { useAdminMode } from "./AdminModeContext";
import { useConnection } from "wagmi";
import { useEffect, useState } from "react";

export interface CompanyClientLayoutProps {
  children: React.ReactNode;
  user: User;
}

export default function CompanyClientLayout({ children, user }: CompanyClientLayoutProps) {
  const { adminMode, setAdminMode } = useAdminMode();
  const { openModal } = useModal();
  const { isConnected } = useConnection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main>
      <header className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">Company Layout</h1>
        {
          user
            ? (
                <>
                  {adminMode && (
                    <button onClick={openModal} className="bg-blue-500 text-white px-4 py-2 rounded-md">
                      {
                        mounted && isConnected ? "Disconnect Wallet" : "Connect Wallet"
                      }
                    </button>
                  )}
                  <LogoutButton />
                </>
              )
            : <Link href="/company/login" className="bg-blue-500 text-white px-4 py-2 rounded-md">ログイン</Link>
        }
      </header>
      {children}
      <footer>
        <label>Admin Mode: </label>
        <input type="checkbox" checked={adminMode} onChange={(e) => {
          setAdminMode(e.target.checked);
          console.log('adminMode:', adminMode);
        }} />
      </footer>
    </main>
  )
}

