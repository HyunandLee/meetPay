"use client";

import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { useConnection } from "wagmi";
import { supabase } from "@/lib/supabase/client";
import { useEffect } from "react";

export function Company() {
  const { isConnected, address } = useConnection();

  useEffect(() => {
    async function getCompany() {
      if (isConnected && address) {
        const { data, error } = await supabase.from("company").select("*").eq("wallet_address", address);
        console.log(data);
      }
    }
    getCompany();
  }, [isConnected, address]);

  return (
    <div className="w-2/3 mx-auto justify-center">
      <ConnectWallet>
        <button data-wallet="connected">Connected</button>
        <button data-wallet="disconnected">Disconnected</button>
      </ConnectWallet>
    </div>
  )
}