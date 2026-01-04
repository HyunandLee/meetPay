"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnections,
  useConnect,
  useDisconnect,
  useWriteContract,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { polygonAmoy } from "wagmi/chains";
import { TJPYC_ADDRESS, TJPYC_DECIMALS } from "@/constants";
import BackToDashboard from "@/components/BackToDashboard";
import tjpycArtifact from "@/abi/tjpyc.json";
import { supabase } from "@/utils/supabaseClient";

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
  const { status: accountStatus } = useAccount();

  const { connectAsync, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [hasEthereum, setHasEthereum] = useState<boolean | null>(null);
  const [profileAddress, setProfileAddress] = useState("");
  const [internalPassword, setInternalPassword] = useState("");

  const [to, setTo] = useState(defaultTo);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const { writeContractAsync, isPending } = useWriteContract();

  // 初回マウントで MetaMask があるか確認し、未接続なら自動接続を試みる（拒否されたらログだけ）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { ethereum } = window as typeof window & { ethereum?: unknown };
    setHasEthereum(!!ethereum);
  }, []);

  useEffect(() => {
    const alreadyConnecting =
      accountStatus === "connecting" || accountStatus === "reconnecting";
    if (alreadyConnecting || isConnected || hasEthereum === false) return;
    connectAsync({ connector: injected(), chainId: polygonAmoy.id }).catch((err) => {
      // 初回ポップアップ拒否などのケース。ユーザー体験のため失敗は握り、手動再接続に任せる。
      console.warn("auto-connect failed", err);
    });
  }, [accountStatus, connectAsync, hasEthereum, isConnected]);

  // プロフィールのウォレットアドレスを取得
  useEffect(() => {
    async function loadProfileAddress() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("company_profiles")
        .select("wallet_address")
        .eq("user_id", user.id)
        .single();
      if (error) {
        console.warn("failed to load profile address", error);
        return;
      }
      if (data?.wallet_address) setProfileAddress(data.wallet_address);
    }
    loadProfileAddress();
  }, []);

  const mismatch = useMemo(() => {
    if (!profileAddress || !myAddress) return false;
    return profileAddress.toLowerCase() !== myAddress.toLowerCase();
  }, [profileAddress, myAddress]);

  const isLargeAmount = useMemo(() => {
    if (!amount) return false;
    try {
      return BigInt(amount) >= BigInt(10_000);
    } catch {
      return false;
    }
  }, [amount]);

  const REQUIRED_PASSWORD = process.env.NEXT_PUBLIC_INTERNAL_PASSWORD;

  async function ensureConnected() {
    if (isConnected) return;
    await connectAsync({ connector: injected(), chainId: polygonAmoy.id });
  }

  async function sendOffer() {
    if (!hasEthereum) {
      alert("MetaMaskをインストールしてから送信してください");
      return;
    }

    if (!internalPassword) {
      alert("社内パスワードを入力してください");
      return;
    }
    if (REQUIRED_PASSWORD && internalPassword !== REQUIRED_PASSWORD) {
      alert("社内パスワードが正しくありません");
      return;
    }

    if (mismatch) {
      alert("プロフィールのウォレットと接続中のウォレットが一致しません");
      return;
    }

    if (!isConnected) {
      try {
        await ensureConnected();
      } catch (err) {
        alert("ウォレットへの接続に失敗しました。MetaMaskを確認してください。");
        console.warn("connect failed", err);
        return;
      }
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
      await disconnect(); // 送信後は明示的に切断する
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

        {hasEthereum === false && (
          <p className="text-red-500 font-semibold">
            MetaMaskが見つかりません。インストールしてから再度お試しください。
          </p>
        )}

        {profileAddress && (
          <p className="text-sm text-gray-700">
            プロフィールのウォレット: {profileAddress}
          </p>
        )}
        {myAddress && (
          <p className="text-sm text-gray-700">
            接続中のウォレット: {myAddress}
          </p>
        )}
        {mismatch && (
          <p className="text-red-600 font-semibold">
            プロフィールのウォレットと接続中のウォレットが一致しません。MetaMaskでアカウントを切り替えてください。
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
              {isLargeAmount && (
                <p className="text-red-600 text-sm mt-2">
                  10,000 JPYC以上の送金です。社内承認を得ているか確認してください。
                </p>
              )}
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

            {/* 社内パスワード */}
            <div>
              <label className="font-semibold mb-2 block">🔒 社内パスワード</label>
              <input
                type="password"
                value={internalPassword}
                onChange={(e) => setInternalPassword(e.target.value)}
                className="w-full p-3 border rounded-xl bg-gray-50"
                placeholder="社内パスワードを入力"
              />
              {REQUIRED_PASSWORD === undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  NEXT_PUBLIC_INTERNAL_PASSWORD が設定されていないため、空以外の入力で通過します。
                </p>
              )}
            </div>

            <button
              onClick={sendOffer}
              disabled={
                isPending ||
                isConnecting ||
                mismatch ||
                !isConnected ||
                hasEthereum === false
              }
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
            >
              {isPending || isConnecting ? "送信中..." : "オファーを送る"}
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
