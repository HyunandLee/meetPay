"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import BackToDashboard from "@/components/BackToDashboard";
import { getTransferLogsByAddress, type OfferLog } from "@/lib/getTransferLogs";
import { supabase } from "@/utils/supabaseClient";

export default function StudentOffersPage() {
  const [logs, setLogs] = useState<OfferLog[]>([]);
  const [profileWallet, setProfileWallet] = useState<`0x${string}` | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null); // プロフ未設定などのエラー表示用に残す

  // プロフィールのウォレットを取得
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfileLoading(false);
        return;
      }

      const { data } = await supabase
        .from("student_profiles")
        .select("wallet_address")
        .eq("user_id", user.id)
        .single();

      if (data?.wallet_address) {
        setProfileWallet(data.wallet_address as `0x${string}`);
      }

      setProfileLoading(false);
    }

    loadProfile();
  }, []);

  // プロフィールウォレットを元に履歴を取得
  useEffect(() => {
    async function load() {
      if (!profileWallet) {
        setLogs([]);
        setLogsLoading(false);
        return;
      }

      setLogsLoading(true);

      const history = await getTransferLogsByAddress(profileWallet);

      const received = history.filter(
        (log) => log.to.toLowerCase() === profileWallet.toLowerCase()
      );

      received.sort((a, b) => b.timestamp - a.timestamp);

      setLogs(received);
      setLogsLoading(false);
    }

    load();
  }, [profileWallet]);

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto">

        {/* 戻るボタン */}
        <BackToDashboard href="/student/dashboard" />

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🎁 企業からのオファー履歴
        </h1>

        {/* ウォレット状態 */}
        <div className="space-y-2 mb-4">
          {profileLoading && (
            <p className="text-gray-500">プロフィールを読み込み中...</p>
          )}

          {!profileLoading && !profileWallet && (
            <p className="text-red-500">
              プロフィールにウォレットアドレスを設定してください。{" "}
              <Link href="/student/profile" className="underline text-blue-600">
                プロフィール編集へ
              </Link>
            </p>
          )}

          {profileWallet && (
            <p className="text-sm text-gray-700">
              プロフィールのウォレット:{" "}
              <span className="font-mono break-all">{profileWallet}</span>
            </p>
          )}

          {connectError && (
            <p className="text-red-500 text-sm">{connectError}</p>
          )}
        </div>

        {logsLoading && (
          <p className="text-gray-500 mt-4">読み込み中...</p>
        )}

        {!logsLoading && logs.length === 0 && profileWallet && (
          <p className="text-gray-600 mt-4">
            まだオファーは届いていません。
          </p>
        )}

        {!profileLoading && !profileWallet && (
          <p className="text-gray-600 mt-4">
            ウォレットを設定するとオファー履歴を表示できます。
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
                href={`https://www.oklink.com/amoy/tx/${log.hash}`}
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
