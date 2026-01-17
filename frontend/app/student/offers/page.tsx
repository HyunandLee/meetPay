"use client";

import { useEffect, useState } from "react";
import { useConnections } from "wagmi";
import BackToDashboard from "@/components/BackToDashboard";
import { getTransferLogsByAddress, type OfferLog } from "@/lib/getTransferLogs";
import { supabase } from "@/utils/supabaseClient";

export default function StudentOffersPage() {
  const [logs, setLogs] = useState<OfferLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [profileAddress, setProfileAddress] = useState<string | null>(null);

  const connections = useConnections();
  const connection = connections[0];
  const myAddress = connection?.accounts?.[0];

  useEffect(() => {
    async function loadProfileWallet() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("student_profiles")
        .select("wallet_address")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (error) {
        console.warn("failed to load student wallet", error);
        return;
      }
      if (data?.wallet_address) setProfileAddress(data.wallet_address);
    }
    loadProfileWallet();
  }, []);

  useEffect(() => {
    async function load() {
      const target = profileAddress ?? myAddress;
      const hasTarget = !!target;
      if (!target) {
        setLogs([]);
        setHasFetched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasFetched(false);
      setLogs([]);
      try {
        const history = await getTransferLogsByAddress(target);

        const received = history.filter(
          (log) => log.to.toLowerCase() === target.toLowerCase()
        );

        received.sort((a, b) => b.timestamp - a.timestamp);

        setLogs(received);
      } catch (error) {
        console.warn("failed to load offer logs", error);
      } finally {
        if (hasTarget) setHasFetched(true);
        setLoading(false);
      }
    }

    load();
  }, [myAddress, profileAddress]);

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto">

        {/* 戻るボタン */}
        <BackToDashboard href="/student/dashboard" />

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🎁 企業からのオファー履歴
        </h1>

        <p className="text-gray-600 text-sm mb-2">
          参照アドレス: {profileAddress ?? myAddress ?? "未設定（接続またはプロフィール登録をしてください）"}
        </p>
        {!profileAddress && !myAddress && (
          <p className="text-red-500">ウォレットを接続するか、プロフィールにウォレットを登録してください。</p>
        )}

        {loading && (
          <p className="text-gray-500 mt-4">ログを取得中です...</p>
        )}

        {!loading && hasFetched && logs.length === 0 && (
          <p className="text-gray-600 mt-4">
            まだオファーは届いていません。
          </p>
        )}

        {/* オファー一覧 */}
        <div className="space-y-4 mt-6">
          {logs.map((log) => (
            <div
              key={log.hash}
              className="bg-white p-5 rounded-xl shadow-md border"
            >
              <p className="font-medium text-gray-900">
                💰 {Number(log.amount) / 1e18} tJPYC を受け取りました
              </p>

              <p className="text-gray-700 mt-1">
                📤 送信元:{" "}
                <span className="font-mono text-sm break-all">
                  {log.from}
                </span>
              </p>

              <p className="text-gray-700">
                🕒 {new Date(log.timestamp * 1000).toLocaleString()}
              </p>

              <a
                href={`https://amoy.polygonscan.com/tx/${log.hash}`}
                target="_blank"
                className="text-blue-600 underline mt-1 inline-block"
              >
                トランザクションを表示 →
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
