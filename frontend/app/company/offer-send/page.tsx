"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useConnections, useWriteContract } from "wagmi";
import { TJPYC_ADDRESS, TJPYC_DECIMALS } from "@/constants";
import BackToDashboard from "@/components/BackToDashboard";
import tjpycArtifact from "@/abi/tjpyc.json";

// 型：送金処理で出るエラー
type WagmiError = {
  message?: string;
};

export default function OfferSendPage() {
  const params = useSearchParams();
  const defaultTo = params.get("to") ?? ""; // 学生アドレス

  const connections = useConnections();
  const connection = connections[0];
  const myAddress = connection?.accounts[0];
  const isConnected = !!connection;

  const [to, setTo] = useState(defaultTo);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const { writeContractAsync, isPending } = useWriteContract();

  async function sendOffer() {
    if (!isConnected) {
      alert("ウォレットに接続してください");
      return;
    }

    if (!to || !amount) {
      alert("送金先と金額は必須です");
      return;
    }

    const weiAmount = BigInt(amount) * BigInt(10 ** TJPYC_DECIMALS);

    try {
      const hash = await writeContractAsync({
        address: TJPYC_ADDRESS,
        abi: tjpycArtifact.abi,
        functionName: "transfer",
        args: [to, weiAmount],
      });

      setTxHash(hash);
    } catch (error: unknown) {
      // unknown を受け取り、型ガードで Error を絞る
      if (error instanceof Error) {
        alert(`送金エラー: ${error.message}`);
      } else {
        const e = error as WagmiError;
        alert(`送金エラー: ${e.message ?? "不明なエラー"}`);
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-xl mx-auto">

        <BackToDashboard />

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🎁 学生へオファーを送る
        </h1>

        {!isConnected && (
          <p className="text-red-500 font-semibold">
            ウォレットに接続してください。
          </p>
        )}

        {isConnected && (
          <div className="bg-white p-6 shadow-md rounded-xl space-y-6">

            {/* 送金先 */}
            <div>
              <label className="font-semibold mb-2 block">🎯 学生ウォレット</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full p-3 border rounded-xl bg-gray-50"
                placeholder="0x1234..."
              />
            </div>

            {/* 送金額 */}
            <div>
              <label className="font-semibold mb-2 block">💰 オファー金額（tJPYC）</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border rounded-xl bg-gray-50"
                placeholder="1000"
              />
            </div>

            {/* メッセージ */}
            <div>
              <label className="font-semibold mb-2 block">💬 メッセージ（任意）</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border rounded-xl bg-gray-50"
                rows={4}
                placeholder="面談のご案内です！よろしくお願いします。"
              />
            </div>

            <button
              onClick={sendOffer}
              disabled={isPending}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
            >
              {isPending ? "送信中..." : "オファーを送る"}
            </button>

            {/* 結果 */}
            {txHash && (
              <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl">
                <p className="font-semibold text-green-800">
                  オファーを送信しました！
                </p>
                <a
                  href={`https://www.oklink.com/amoy/tx/${txHash}`}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  トランザクションを見る →
                </a>
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}
