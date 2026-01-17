"use client";

import { useState } from "react";
import { useConnections, useWriteContract } from "wagmi";
import { TJPYC_ADDRESS, TJPYC_DECIMALS } from "../../constants";
import tjpycArtifact from "../../abi/tjpyc.json";

export default function SendPage() {
  const connections = useConnections();
  const connection = connections[0];
  const myAddress = connection?.accounts[0];
  const isConnected = !!connection;

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");

  const { writeContractAsync, isPending, error } = useWriteContract();

  async function sendToken() {
    if (!isConnected) {
      alert("ウォレットに接続してください");
      return;
    }

    if (!to || !amount) {
      alert("送金先と金額を入力してください");
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
    } catch (err: unknown) {
      alert(
        "送金失敗：" + (err instanceof Error ? err.message : "不明なエラー")
      );
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Send tJPYC</h1>

      {!isConnected ? (
        <p>ウォレットに接続してください。</p>
      ) : (
        <>
          <p>あなたのアドレス: {myAddress}</p>

          <div style={{ marginTop: 20 }}>
            <label>送金先アドレス：</label>
            <input
              type="text"
              placeholder="0x1234..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "8px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <label>送金金額（tJPYC）：</label>
            <input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "8px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            />
          </div>

          <button
            onClick={sendToken}
            disabled={isPending}
            style={{
              marginTop: 30,
              padding: "12px 22px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {isPending ? "送金中..." : "送金する"}
          </button>

          {txHash && (
            <p style={{ marginTop: 20 }}>
              Tx Hash:{" "}
              <a
                href={`https://amoy.polygonscan.com/tx/${txHash}`}
                target="_blank"
                style={{ color: "#3b82f6" }}
              >
                {txHash}
              </a>
            </p>
          )}

          {error && (
            <p style={{ color: "red", marginTop: 20 }}>
              Error: {error.message}
            </p>
          )}
        </>
      )}
    </main>
  );
}
