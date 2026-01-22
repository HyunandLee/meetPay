"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { createPublicClient, http, parseAbiItem } from "viem";
import { polygonAmoy } from "viem/chains";
import { TJPYC_ADDRESS } from "@/constants";
import Link from "next/link";
import BackToDashboard from "@/components/BackToDashboard";

type OfferLog = {
  to: `0x${string}`;
  amount: bigint;
  hash: `0x${string}`;
};

export default function CompanyOffers() {
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(null);
  const [logs, setLogs] = useState<OfferLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return setLoading(false);

      const { data } = await supabase
        .from("company_profiles")
        .select("wallet_address")
        .eq("user_id", user.id)
        .single();

      if (!data?.wallet_address) {
        setLoading(false);
        return;
      }

      setWalletAddress(data.wallet_address as `0x${string}`);

      const client = createPublicClient({
        chain: polygonAmoy,
        transport: http(process.env.NEXT_PUBLIC_AMOY_RPC_URL),
      });

      const eventAbi = parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 value)"
      );

      const latest = await client.getBlockNumber();
      const fromBlock = latest > 50_000n ? latest - 50_000n : 0n;

      const rawLogs = await client.getLogs({
        address: TJPYC_ADDRESS,
        event: eventAbi,
        args: { from: data.wallet_address },
        fromBlock,
      });

      const formatted: OfferLog[] = rawLogs.map((log) => ({
        to: log.args!.to as `0x${string}`,
        amount: log.args!.value!,
        hash: log.transactionHash!,
      }));

      setLogs(formatted);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-sky-100 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto">

        {/* 共通：ダッシュボードに戻る */}
        <BackToDashboard href="/company/dashboard" />

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          💸 企業オファー履歴（tJPYC）
        </h1>

        {!walletAddress && !loading && (
          <p className="text-gray-600">
            ウォレットアドレスが設定されていません。
          </p>
        )}

        {loading && <p className="text-gray-500 text-lg">読み込み中...</p>}

        {!loading && logs.length === 0 && walletAddress && (
          <p className="text-gray-600 text-lg">まだ送金履歴がありません。</p>
        )}

        <div className="space-y-6 mt-4">
          {logs.map((log, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl p-6 border border-gray-200"
            >
              <div className="text-gray-900 font-semibold mb-2">
                🎯 送金先: {log.to}
              </div>

              <div className="text-lg flex items-center gap-2">
                💰 金額: {Number(log.amount) / 1e18} tJPYC
              </div>

              <a
                href={`https://amoy.polygonscan.com/tx/${log.hash}`}
                target="_blank"
                className="text-blue-600 underline mt-3 inline-block"
              >
                トランザクションを見る →
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
