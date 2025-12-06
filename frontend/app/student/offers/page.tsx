"use client";

import { useEffect, useState } from "react";
import { useConnections } from "wagmi";
import BackToDashboard from "@/components/BackToDashboard";
import { getTransferLogsByAddress, type OfferLog } from "@/lib/getTransferLogs";

export default function StudentOffersPage() {
  const [logs, setLogs] = useState<OfferLog[]>([]);
  const [loading, setLoading] = useState(true);

  const connections = useConnections();
  const connection = connections[0];
  const myAddress = connection?.accounts?.[0];

  useEffect(() => {
    async function load() {
      if (!myAddress) {
        setLoading(false);
        return;
      }

      const history = await getTransferLogsByAddress(myAddress);

      const received = history.filter(
        (log) => log.to.toLowerCase() === myAddress.toLowerCase()
      );

      received.sort((a, b) => b.timestamp - a.timestamp);

      setLogs(received);
      setLoading(false);
    }

    load();
  }, [myAddress]);

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto">

        {/* 戻るボタン */}
        <BackToDashboard />

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🎁 企業からのオファー履歴
        </h1>

        {!myAddress && (
          <p className="text-red-500">ウォレットを接続してください。</p>
        )}

        {loading && (
          <p className="text-gray-500 mt-4">読み込み中...</p>
        )}

        {!loading && logs.length === 0 && (
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
