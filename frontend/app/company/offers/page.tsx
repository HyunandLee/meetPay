"use client";

import { z } from "zod";
import { useEffect, useState } from "react";
import { getCompany } from "@/utils/company";
import { createPublicClient, http, parseAbiItem } from "viem";
import { polygonAmoy } from "viem/chains";
import { TJPYC_ADDRESS } from "@/constants";
import BackToDashboard from "@/components/BackToDashboard";
import { useConnection } from "wagmi";

const offerLogSchema = z.object({
  to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  amount: z.bigint(),
  hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
});

type OfferLog = z.infer<typeof offerLogSchema>;

export default function CompanyOffers() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [logs, setLogs] = useState<OfferLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, address } = useConnection();

  useEffect(() => {
    async function load() {
      try {
        const company = await getCompany(isConnected, address);
        console.log("company", company);
        if (!company) {
          setLoading(false);
          return;
        }

        const walletAddr = company.walletAddress;
        console.log(walletAddr);
        console.log("walletAddr", walletAddr);
        if (walletAddr.length !== 42 || !walletAddr.startsWith("0x")) {
          setLoading(false);
          return;
        }
        const validatedWalletAddr = z.string().regex(/^0x[0-9a-fA-F]{40}$/).parse(walletAddr);
        if (!validatedWalletAddr) {
          setLoading(false);
          return;
        }

        // validate wallet address
        setWalletAddress(validatedWalletAddr);

        const client = createPublicClient({
          chain: polygonAmoy,
          transport: http(process.env.NEXT_PUBLIC_AMOY_RPC_URL),
        });

        const eventAbi = parseAbiItem(
          "event Transfer(address indexed from, address indexed to, uint256 value)"
        );

        // ... existing code ...

        const latest = await client.getBlockNumber();
        // フリーティアのRPCでは10,000ブロックを超える範囲はサポートされていないため制限
        // fromBlockとtoBlockの差が10,000ブロック以内になるようにする
        const maxBlockRange = 10_000n;
        const fromBlock = latest > maxBlockRange ? latest - maxBlockRange : 0n;
        const toBlock = latest; // 明示的にtoBlockを指定

        console.log("Block range:", { 
          latest: latest.toString(), 
          fromBlock: fromBlock.toString(), 
          toBlock: toBlock.toString(), 
          range: (toBlock - fromBlock).toString() 
        });

        let rawLogs: Awaited<ReturnType<typeof client.getLogs>> = [];
        try {
          rawLogs = await client.getLogs({
            address: TJPYC_ADDRESS,
            event: eventAbi,
            args: { from: walletAddr },
            fromBlock,
            toBlock, // 明示的にtoBlockを指定
          });
        } catch (error: any) {
          console.error("Error fetching logs:", error);
          // エラーが発生した場合は空の配列のまま
        }

        // ... existing code ...

        const formatted: OfferLog[] = rawLogs.map((log: any) => ({
          to: log.args!.to as `0x${string}`,
          amount: log.args!.value!,
          hash: log.transactionHash!,
        }));
        console.log("formatted", formatted);
        setLogs(formatted);
      } catch (error: any) {
        console.error("Error loading company offers:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isConnected, address]);

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto">

        {/* 共通：ダッシュボードに戻る */}
        <BackToDashboard />

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
                href={`https://www.oklink.com/amoy/tx/${log.hash}`}
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
