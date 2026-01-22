import {
  createPublicClient,
  http,
  parseAbiItem,
  type Hex,
} from "viem";
import { polygonAmoy } from "viem/chains";
import { TJPYC_ADDRESS } from "@/constants";

export type OfferLog = {
  from: string;
  to: string;
  amount: bigint;
  hash: string;
  timestamp: number;
};

// Transfer イベント ABI（indexed を含むので viem が args を型推論できる）
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

// viem が返す Transfer イベントの型
type TransferEventArgs = {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
};

export async function getTransferLogsByAddress(target: string) {
  const client = createPublicClient({
    chain: polygonAmoy,
    transport: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL!),
  });

  const latest = await client.getBlockNumber();
  // フリーティアのRPCでは10,000ブロックを超える範囲はサポートされていないため制限
  const fromBlock = latest > 10_000n ? latest - 10_000n : 0n;

  let logs;
  try {
    logs = await client.getLogs({
      address: TJPYC_ADDRESS as Hex,
      event: transferEvent,
      // ⭐ target 宛だけ取得（高速 & 正確）
      args: {
        from: undefined,
        to: target as Hex,
      },
      fromBlock,
      toBlock: latest,
    });
  } catch (error: any) {
    console.error("Error fetching transfer logs:", error);
    // エラーが発生した場合は空の配列を返す
    return [];
  }

  const result: OfferLog[] = [];

  for (const log of logs) {
    // viem の型を TransferEventArgs に確定させる
    const args = log.args as TransferEventArgs | undefined;
    if (!args) continue;

    const block = await client.getBlock({ blockNumber: log.blockNumber! });

    result.push({
      from: args.from,
      to: args.to,
      amount: args.value,
      hash: log.transactionHash!,
      timestamp: Number(block.timestamp),
    });
  }

  return result;
}
