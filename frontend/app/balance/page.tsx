"use client";

import { useConnections, useReadContract } from "wagmi";
import { TJPYC_ADDRESS, TJPYC_DECIMALS } from "@/constants";
import tjpycArtifact from "@/abi/tjpyc.json";

export default function BalancePage() {
  const connections = useConnections();
  const connection = connections[0];
  const myAddress = connection?.accounts[0];
  const isConnected = !!connection;

  // 自分の残高だけ取得
  const { data: balance, isLoading, refetch, error } = useReadContract({
    address: TJPYC_ADDRESS,
    abi: tjpycArtifact.abi,
    functionName: "balanceOf",
    args: [myAddress ?? "0x0000000000000000000000000000000000000000"],
  });

  const humanReadable =
    balance !== undefined
      ? Number(balance) / 10 ** TJPYC_DECIMALS
      : 0;

  return (
    <main style={{ padding: 40 }}>
      <h1>Your Balance</h1>

      {!isConnected ? (
        <p>ウォレットを接続してください。</p>
      ) : (
        <>
          <p>あなたのアドレス：{myAddress}</p>

          <button
            onClick={() => refetch()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Refresh Balance
          </button>

          <div style={{ marginTop: "30px" }}>
            {isLoading ? (
              <p>読み込み中...</p>
            ) : (
              <p>
                残高：<strong>{humanReadable} tJPYC</strong>
              </p>
            )}
          </div>

          {error && <p style={{ color: "red" }}>エラー: {error.message}</p>}
        </>
      )}
    </main>
  );
}
