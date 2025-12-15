"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount, useConnect, useWriteContract, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { TJPYC_ADDRESS, TJPYC_DECIMALS } from "@/constants";
import BackToDashboard from "@/components/BackToDashboard";
import tjpycArtifact from "@/abi/tjpyc.json";
import { supabase } from "@/utils/supabaseClient";

type WagmiError = { message?: string };

export default function OfferSendPage() {
  const params = useSearchParams();
  const defaultTo = params.get("to") ?? "";
  const router = useRouter();

  // wagmi 正式フックでアドレス取得（最も安定）
  const { address: myAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const injectedConnector = connectors.find((c) => c.id === "injected");

  const [to, setTo] = useState(defaultTo);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [profileWallet, setProfileWallet] = useState<`0x${string}` | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const autoConnectRef = useRef(false);

  const { writeContractAsync, isPending } = useWriteContract();

  // プロフィールからウォレットを取得
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
        .from("company")
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

  // プロフィールウォレットがあり、未接続なら自動で接続を試行
  useEffect(() => {
    if (!profileWallet) return;
    if (isConnected) return;
    if (autoConnectRef.current) return;
    if (!injectedConnector) return;

    autoConnectRef.current = true;
    (async () => {
      try {
        setConnectError(null);
        setConnectLoading(true);
        await connectAsync({ connector: injectedConnector, chainId: polygonAmoy.id });
      } catch (err) {
        const msg =
          (err as { shortMessage?: string })?.shortMessage ??
          (err instanceof Error ? err.message : "ウォレット接続に失敗しました");
        setConnectError(msg);
      } finally {
        setConnectLoading(false);
      }
    })();
  }, [profileWallet, isConnected, injectedConnector, connectAsync]);

  const addressMismatch =
    profileWallet &&
    myAddress &&
    profileWallet.toLowerCase() !== myAddress.toLowerCase();

  async function sendOffer() {
    if (!isConnected || !myAddress) {
      alert("ウォレットに接続してください");
      return;
    }

    if (addressMismatch) {
      alert("プロフィールのウォレットと接続中のウォレットが一致していません。プロフィールのウォレットで接続してください。");
      return;
    }

    const sanitized = to.trim().replace(/\u200B/g, "");

    setTo(sanitized);

    // 必須チェック
    if (!sanitized || !amount) {
      alert("送金先と金額は必須です");
      return;
    }

    // 形式チェック
    if (!/^0x[0-9a-fA-F]{40}$/.test(sanitized)) {
      console.error("INVALID ADDRESS:", sanitized);
      alert("ウォレットアドレスが不正です");
      return;
    }

    const weiAmount = BigInt(amount) * BigInt(10 ** TJPYC_DECIMALS);

    try {
      const hash = await writeContractAsync({
        address: TJPYC_ADDRESS,
        abi: tjpycArtifact.abi,
        functionName: "transfer",
        args: [sanitized, weiAmount],
        account: myAddress,
      });

      setTxHash(hash);
    } catch (error: unknown) {
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

        {/* プロフィールウォレットの状態表示 */}
        <div className="mb-4 space-y-2">
          {profileLoading && (
            <p className="text-gray-500 text-sm">プロフィールを読み込み中...</p>
          )}

          {!profileLoading && !profileWallet && (
            <p className="text-red-500 font-semibold">
              プロフィールにウォレットアドレスを設定してください。
              <button
                onClick={() => router.push("/company/profile")}
                className="ml-2 underline text-blue-600"
              >
                プロフィール編集へ
              </button>
            </p>
          )}

          {profileWallet && (
            <p className="text-sm text-gray-700">
              プロフィールのウォレット:{" "}
              <span className="font-mono break-all">{profileWallet}</span>
            </p>
          )}

          {myAddress && (
            <p className="text-sm text-gray-700">
              接続中のウォレット:{" "}
              <span className="font-mono break-all">{myAddress}</span>
            </p>
          )}

          {addressMismatch && (
            <p className="text-red-500 font-semibold">
              接続中のウォレットがプロフィールと異なります。プロフィールのウォレットで接続してください。
            </p>
          )}
          {connectError && (
            <p className="text-red-500 text-sm">{connectError}</p>
          )}

          {!isConnected && profileWallet && injectedConnector && (
            <button
              onClick={async () => {
                try {
                  setConnectLoading(true);
                  setConnectError(null);
                  await connectAsync({
                    connector: injectedConnector,
                    chainId: polygonAmoy.id,
                  });
                } catch (err) {
                  const msg =
                    (err as { shortMessage?: string })?.shortMessage ??
                    (err instanceof Error ? err.message : "ウォレット接続に失敗しました");
                  setConnectError(msg);
                } finally {
                  setConnectLoading(false);
                }
              }}
              disabled={connectLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60"
            >
              {connectLoading ? "接続中..." : "プロフィールのウォレットで接続する"}
            </button>
          )}
          {isConnected && (
            <button
              onClick={() => disconnect()}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md"
            >
              接続をいったん解除する
            </button>
          )}

          {isConnected && chainId !== polygonAmoy.id && (
            <button
              onClick={async () => {
                try {
                  setConnectError(null);
                  await switchChainAsync({ chainId: polygonAmoy.id });
                } catch (err) {
                  const msg =
                    (err as { shortMessage?: string })?.shortMessage ??
                    (err instanceof Error ? err.message : "ネットワーク切替に失敗しました");
                  setConnectError(msg);
                }
              }}
              className="px-3 py-2 bg-orange-500 text-white rounded-md"
            >
              Polygon Amoy に切り替える
            </button>
          )}
        </div>

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
              <label className="font-semibold mb-2 block">💰 オフェー金額（tJPYC）</label>
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
              disabled={!isConnected || isPending}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
            >
              {isPending ? "送信中..." : "オファーを送る"}
            </button>

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
