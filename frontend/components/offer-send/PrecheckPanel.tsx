import { polygonAmoy } from "wagmi/chains";

type PrecheckPanelProps = {
  chainMismatch: boolean;
  activeChainId: number | undefined;
  walletSelectedAddress: string | undefined;
  walletAccountMismatch: boolean;
  walletAccountsLoading: boolean;
  tokenBalanceLoading: boolean;
  tokenBalanceError: unknown;
  tokenBalanceDisplay: string;
  walletRpcBalanceLoading: boolean;
  walletRpcBalanceError: string | null;
  walletRpcBalanceDisplay: string;
  nativeBalanceLoading: boolean;
  nativeBalanceError: unknown;
  nativeBalanceDisplay: string;
  simulateEnabled: boolean;
  simulateLoading: boolean;
  simulateErrorMessage: string | null;
  walletRpcGasLoading: boolean;
  walletRpcGasError: string | null;
  walletRpcGas: bigint | null;
  gasEstimateLoading: boolean;
  gasEstimateError: string | null;
  gasEstimate: bigint | null;
  precheckIssues: string[];
  isSwitchingChain: boolean;
  onSwitchChain: () => void;
  onRefreshAccounts: () => void;
};

export function PrecheckPanel({
  chainMismatch,
  activeChainId,
  walletSelectedAddress,
  walletAccountMismatch,
  walletAccountsLoading,
  tokenBalanceLoading,
  tokenBalanceError,
  tokenBalanceDisplay,
  walletRpcBalanceLoading,
  walletRpcBalanceError,
  walletRpcBalanceDisplay,
  nativeBalanceLoading,
  nativeBalanceError,
  nativeBalanceDisplay,
  simulateEnabled,
  simulateLoading,
  simulateErrorMessage,
  walletRpcGasLoading,
  walletRpcGasError,
  walletRpcGas,
  gasEstimateLoading,
  gasEstimateError,
  gasEstimate,
  precheckIssues,
  isSwitchingChain,
  onSwitchChain,
  onRefreshAccounts,
}: PrecheckPanelProps) {
  return (
    <div className="border rounded-xl bg-gray-50 p-4 space-y-2">
      <p className="font-semibold">事前チェック</p>
      <div className="text-sm text-gray-700 space-y-1">
        <p>
          チェーン: {chainMismatch ? "NG" : "OK"}{" "}
          {activeChainId ? `(chainId: ${activeChainId})` : "(未取得)"}
        </p>
        {chainMismatch && (
          <button
            type="button"
            onClick={onSwitchChain}
            className="mt-1 inline-flex items-center rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-300"
            disabled={isSwitchingChain}
          >
            {isSwitchingChain ? "切り替え中..." : "Amoy に切り替え"}
          </button>
        )}
        <p>
          ウォレット選択アカウント:{" "}
          {walletAccountsLoading ? "取得中..." : walletSelectedAddress ?? "未取得"}
        </p>
        {walletAccountMismatch && (
          <button
            type="button"
            onClick={onRefreshAccounts}
            className="mt-1 inline-flex items-center rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-300"
            disabled={walletAccountsLoading}
          >
            {walletAccountsLoading ? "再接続中..." : "アカウント再接続"}
          </button>
        )}
        <p>
          tJPYC 残高:{" "}
          {tokenBalanceLoading
            ? "取得中..."
            : tokenBalanceError
              ? "取得失敗"
              : `${tokenBalanceDisplay} tJPYC`}
        </p>
        <p>
          MetaMask RPC tJPYC 残高:{" "}
          {walletRpcBalanceLoading
            ? "取得中..."
            : walletRpcBalanceError
              ? "取得失敗"
              : `${walletRpcBalanceDisplay} tJPYC`}
        </p>
        <p>
          MATIC 残高:{" "}
          {nativeBalanceLoading
            ? "取得中..."
            : nativeBalanceError
              ? "取得失敗"
              : nativeBalanceDisplay}
        </p>
        <p>
          simulate:{" "}
          {!simulateEnabled
            ? "入力待ち"
            : simulateLoading
              ? "確認中..."
              : simulateErrorMessage
                ? `NG (${simulateErrorMessage})`
                : "OK"}
        </p>
        <p>
          MetaMask RPC ガス見積もり:{" "}
          {!simulateEnabled
            ? "入力待ち"
            : walletRpcGasLoading
              ? "見積もり中..."
              : walletRpcGasError
                ? `NG (${walletRpcGasError})`
                : walletRpcGas
                  ? walletRpcGas.toString()
                  : "未取得"}
        </p>
        <p>
          ガス見積もり:{" "}
          {!simulateEnabled
            ? "入力待ち"
            : gasEstimateLoading
              ? "見積もり中..."
              : gasEstimateError
                ? `NG (${gasEstimateError})`
                : gasEstimate
                  ? gasEstimate.toString()
                  : "未取得"}
        </p>
      </div>
      {precheckIssues.length > 0 && (
        <div className="text-sm text-red-600">
          {precheckIssues.map((issue) => (
            <p key={issue}>{issue}</p>
          ))}
        </div>
      )}
    </div>
  );
}
