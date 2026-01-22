"use client";

import { useState } from "react";
import { useConnections } from "wagmi";
import { createPublicClient, http, parseAbiItem } from "viem";
import { polygonAmoy } from "viem/chains";

import { TJPYC_ADDRESS, TJPYC_DECIMALS } from "../../constants";

// on-chainログの生データ（必要な部分だけ切り出した型）
type RawLog = {
  args: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: bigint;
  };
  blockNumber: bigint;
  transactionHash: `0x${string}`;
};

// 画面で使う整形済みのログ
type TransferLog = {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  blockNumber: bigint;
  txHash: `0x${string}`;
  timestamp: number; // 秒
};

export default function HistoryPage() {
  const connections = useConnections();
  const connection = connections[0];
  const myAddress = connection?.accounts[0];
  const isConnected = !!connection;

  const [logs, setLogs] = useState<TransferLog[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    if (!myAddress) return;
    setLoading(true);

    const client = createPublicClient({
      chain: polygonAmoy,
      transport: http(process.env.NEXT_PUBLIC_AMOY_RPC_URL),
    });

    // Transfer イベント
    const eventAbi = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    );

    // 最新ブロック番号
    const latestBlock = await client.getBlockNumber();

    // フリーティアのRPCでは10,000ブロックを超える範囲はサポートされていないため制限
    const fromBlock =
      latestBlock > BigInt(10000)
        ? latestBlock - BigInt(10000)
        : BigInt(0);

    let receivedRaw: RawLog[] = [];
    let sentRaw: RawLog[] = [];

    try {
      // 受信ログ（to = 自分）
      receivedRaw = (await client.getLogs({
        address: TJPYC_ADDRESS,
        event: eventAbi,
        args: { to: myAddress },
        fromBlock,
      })) as RawLog[];

      // 送信ログ（from = 自分）
      sentRaw = (await client.getLogs({
        address: TJPYC_ADDRESS,
        event: eventAbi,
        args: { from: myAddress },
        fromBlock,
      })) as RawLog[];
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      // エラーが発生した場合は空の配列のまま
    }

    // RawLog にブロックの timestamp を付けて TransferLog に変換
    const addTimestamp = async (log: RawLog): Promise<TransferLog> => {
      const block = await client.getBlock({ blockNumber: log.blockNumber });

      return {
        from: log.args.from,
        to: log.args.to,
        value: log.args.value,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        timestamp: Number(block.timestamp),
      };
    };

    const received = await Promise.all(receivedRaw.map(addTimestamp));
    const sent = await Promise.all(sentRaw.map(addTimestamp));

    // 送信 + 受信をマージして、日時順にソート
    const merged = [...received, ...sent].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    setLogs(merged);
    setLoading(false);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Transaction History</h1>

      {!isConnected ? (
        <p>ウォレットを接続してください。</p>
      ) : (
        <>
          <p>あなたのアドレス：{myAddress}</p>

          <button
            onClick={loadHistory}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              marginTop: 20,
            }}
          >
            {loading ? "読み込み中..." : "履歴を表示する"}
          </button>

          <div style={{ marginTop: 30 }}>
            {logs.length === 0 && !loading && (
              <p>履歴がありません。</p>
            )}

            {logs.map((log, idx) => {
              const amount = Number(log.value) / 10 ** TJPYC_DECIMALS;
              const date = new Date(log.timestamp * 1000).toLocaleString();
              const isSent = log.from === myAddress;

              return (
                <div
                  key={idx}
                  style={{
                    borderBottom: "1px solid #ddd",
                    padding: "12px 0",
                    marginBottom: "10px",
                  }}
                >
                  <p>
                    <strong style={{ color: isSent ? "red" : "green" }}>
                      {isSent ? "👋 送信" : "📥 受信"}
                    </strong>
                  </p>

                  <p>日時: {date}</p>
                  <p>From: {log.from}</p>
                  <p>To: {log.to}</p>
                  <p>Amount: {amount} tJPYC</p>

                  <p>
                    Tx:{" "}
                    <a
                      href={`https://www.oklink.com/amoy/tx/${log.txHash}`}
                      target="_blank"
                    >
                      {log.txHash}
                    </a>
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
