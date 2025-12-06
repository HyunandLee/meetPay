"use client";

import { useConnections, useDisconnect, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import Link from "next/link";

export default function Home() {
  // 接続情報
  const connections = useConnections();
  const connection = connections[0];
  const address = connection?.accounts[0];
  const isConnected = !!connection;

  // connect と disconnect
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  function connectWallet() {
    connect({
      connector: injected(),  // ★ v3ではここ！
    });
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>MeetPay Demo</h1>

      {/* ウォレット接続/切断 */}
      {!isConnected ? (
        <button
          onClick={connectWallet}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <p>Connected: {address}</p>
          <button
            onClick={() => disconnect()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ef4444",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            Disconnect
          </button>
        </>
      )}

      {/* ナビゲーション */}
      <div style={{ marginTop: 30 }}>
        <h2>Actions</h2>

        <Link href="/send">
          <button
            style={{
              display: "block",
              padding: "12px 20px",
              marginTop: "10px",
              width: "200px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Send tJPYC
          </button>
        </Link>

        <Link href="/balance">
          <button
            style={{
              display: "block",
              padding: "12px 20px",
              marginTop: "10px",
              width: "200px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Check Balance
          </button>
        </Link>

        <Link href="/history">
          <button
            style={{
              display: "block",
              padding: "12px 20px",
              marginTop: "10px",
              width: "200px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            View History
          </button>
        </Link>

      </div>
    </main>
  );
}
