"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useSimulateContract,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { polygonAmoy } from "wagmi/chains";
import {
  BaseError,
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  formatUnits,
  isAddress,
  parseUnits,
} from "viem";
import { TJPYC_ADDRESS, TJPYC_DECIMALS } from "@/constants";
import BackToDashboard from "@/components/BackToDashboard";
import tjpycArtifact from "@/abi/tjpyc.json";
import { supabase } from "@/utils/supabaseClient";
import {
  fetchRecentInterviewees,
  fetchThreadStudentWallet,
} from "@/lib/chatApi";
import { RecentInterview } from "@/lib/chatTypes";

// 型：送金処理で出るエラー
type WagmiError = {
  message?: string;
  shortMessage?: string;
};

type EthereumProvider = {
  request: (...args: any[]) => Promise<unknown>;
  isBraveWallet?: boolean;
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function OfferSendPage() {
  const params = useSearchParams();
  const defaultTo = params.get("to") ?? ""; // 学生アドレス
  const defaultThread = params.get("thread") ?? "";

  const {
    address: myAddress,
    chainId: accountChainId,
    isConnected,
  } = useAccount();
  const chainId = useChainId();
  const activeChainId = accountChainId ?? chainId;

  const { connectAsync, isPending: isConnecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const {
    switchChainAsync,
    isPending: isSwitchingChain,
    error: switchChainError,
  } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: polygonAmoy.id });
  const [hasEthereum, setHasEthereum] = useState<boolean | null>(null);
  const [profileAddress, setProfileAddress] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [internalPassword, setInternalPassword] = useState("");

  const [to, setTo] = useState(defaultTo);
  const [threadId, setThreadId] = useState(defaultThread);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [recentInterviewees, setRecentInterviewees] = useState<RecentInterview[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [gasEstimateError, setGasEstimateError] = useState<string | null>(null);
  const [gasEstimateLoading, setGasEstimateLoading] = useState(false);
  const [walletRpcBalance, setWalletRpcBalance] = useState<bigint | null>(null);
  const [walletRpcBalanceError, setWalletRpcBalanceError] = useState<string | null>(null);
  const [walletRpcBalanceLoading, setWalletRpcBalanceLoading] = useState(false);
  const [walletRpcGas, setWalletRpcGas] = useState<bigint | null>(null);
  const [walletRpcGasError, setWalletRpcGasError] = useState<string | null>(null);
  const [walletRpcGasLoading, setWalletRpcGasLoading] = useState(false);
  const [walletAccounts, setWalletAccounts] = useState<string[]>([]);
  const [walletAccountsError, setWalletAccountsError] = useState<string | null>(null);
  const [walletAccountsLoading, setWalletAccountsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const pickInjectedProvider = useMemo(() => {
    return (window?: Window) => {
      const ethereum = window?.ethereum as EthereumProvider | undefined;
      if (!ethereum) return undefined;
      const providers = ethereum.providers;
      if (Array.isArray(providers) && providers.length > 0) {
        return (
          providers.find((provider) => provider.isBraveWallet) ??
          providers.find((provider) => provider.isMetaMask) ??
          providers[0]
        );
      }
      return ethereum;
    };
  }, []);

  const injectedConnector = useMemo(() => {
    return injected({
      target: {
        id: "braveWallet",
        name: "Brave Wallet",
        provider: pickInjectedProvider,
      },
    });
  }, [pickInjectedProvider]);

  const ethereumProvider = useMemo<EthereumProvider | null>(() => {
    if (typeof window === "undefined") return null;
    const provider = pickInjectedProvider(window);
    if (!provider || typeof provider.request !== "function") {
      return null;
    }
    return provider;
  }, [hasEthereum, pickInjectedProvider]);

  const walletRpcClient = useMemo(() => {
    if (!ethereumProvider) return null;
    return createPublicClient({
      chain: polygonAmoy,
      transport: custom(ethereumProvider),
    });
  }, [ethereumProvider]);

  const walletClient = useMemo(() => {
    if (!ethereumProvider) return null;
    return createWalletClient({
      chain: polygonAmoy,
      transport: custom(ethereumProvider),
    });
  }, [ethereumProvider]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const { data: tokenBalance, isLoading: tokenBalanceLoading, error: tokenBalanceError } =
    useReadContract({
      address: TJPYC_ADDRESS,
      abi: tjpycArtifact.abi,
      functionName: "balanceOf",
      args: [myAddress ?? ZERO_ADDRESS],
      query: { enabled: !!myAddress },
    });

  const { data: nativeBalance, isLoading: nativeBalanceLoading, error: nativeBalanceError } =
    useBalance({
      address: myAddress as `0x${string}` | undefined,
      query: { enabled: !!myAddress },
    });

  // 初回マウントで MetaMask があるか確認し、未接続なら自動接続を試みる（拒否されたらログだけ）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { ethereum } = window as typeof window & { ethereum?: unknown };
    setHasEthereum(!!ethereum);
  }, []);

  // auto-connect は使わず、手動接続ボタン/送信時の再接続に寄せる

  useEffect(() => {
    let cancelled = false;
    if (!ethereumProvider) {
      setWalletAccounts([]);
      setWalletAccountsError(null);
      setWalletAccountsLoading(false);
      return undefined;
    }

    setWalletAccountsLoading(true);
    setWalletAccountsError(null);

    ethereumProvider
      .request({ method: "eth_accounts" })
      .then((result) => {
        if (cancelled) return;
        if (Array.isArray(result)) {
          setWalletAccounts(result as string[]);
        } else {
          setWalletAccounts([]);
          setWalletAccountsError("ウォレットのアカウント情報が取得できませんでした。");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : (err as WagmiError).shortMessage ?? (err as WagmiError).message;
        setWalletAccounts([]);
        setWalletAccountsError(message ?? "不明なエラー");
      })
      .finally(() => {
        if (cancelled) return;
        setWalletAccountsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ethereumProvider, activeChainId, isConnected]);

  // threadパラメータがある場合は紐づくウォレットを取得
  useEffect(() => {
    if (!threadId) return;
    fetchThreadStudentWallet(threadId)
      .then((wallet) => {
        if (wallet) setTo(wallet);
      })
      .catch((err) => console.warn("failed to fetch wallet from thread", err));
  }, [threadId]);

  // プロフィールのウォレットアドレスを取得
  useEffect(() => {
    async function loadProfileAddress() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("company_profiles")
        .select("id, wallet_address")
        .eq("user_id", user.id)
        .single();
      if (error) {
        console.warn("failed to load profile address", error);
        return;
      }
      if (data?.wallet_address) setProfileAddress(data.wallet_address);
      if (data?.id) {
        setCompanyId(data.id);
        fetchRecentInterviewees(data.id)
          .then(setRecentInterviewees)
          .catch((err) => console.warn("recent interviews load failed", err));
      }
    }
    loadProfileAddress();
  }, []);

  const mismatch = useMemo(() => {
    if (!profileAddress || !myAddress) return false;
    return profileAddress.toLowerCase() !== myAddress.toLowerCase();
  }, [profileAddress, myAddress]);

  const chainMismatch = useMemo(() => {
    if (!activeChainId) return false;
    return activeChainId !== polygonAmoy.id;
  }, [activeChainId]);

  const walletSelectedAddress = useMemo(() => {
    return walletAccounts[0];
  }, [walletAccounts]);

  const walletAccountMismatch = useMemo(() => {
    if (!walletSelectedAddress || !myAddress) return false;
    return walletSelectedAddress.toLowerCase() !== myAddress.toLowerCase();
  }, [myAddress, walletSelectedAddress]);

  const isLargeAmount = useMemo(() => {
    if (!amount) return false;
    try {
      return BigInt(amount) >= BigInt(10_000);
    } catch {
      return false;
    }
  }, [amount]);

  const toIsValid = useMemo(() => {
    if (!to) return false;
    return isAddress(to);
  }, [to]);

  const parsedAmount = useMemo(() => {
    if (!amount) return null;
    try {
      return parseUnits(amount, TJPYC_DECIMALS);
    } catch {
      return null;
    }
  }, [amount]);

  const simulateArgs = useMemo(() => {
    if (!toIsValid || !parsedAmount) return null;
    return [to as `0x${string}`, parsedAmount] as const;
  }, [parsedAmount, to, toIsValid]);

  const simulateEnabled = Boolean(simulateArgs && myAddress);

  const {
    error: simulateError,
    isLoading: simulateLoading,
  } = useSimulateContract({
    address: TJPYC_ADDRESS,
    abi: tjpycArtifact.abi,
    functionName: "transfer",
    args: simulateArgs ?? [ZERO_ADDRESS, 0n],
    account: myAddress as `0x${string}` | undefined,
    chainId: polygonAmoy.id,
    query: { enabled: simulateEnabled },
  });

  useEffect(() => {
    let cancelled = false;
    if (!walletRpcClient || !myAddress) {
      setWalletRpcBalance(null);
      setWalletRpcBalanceError(null);
      setWalletRpcBalanceLoading(false);
      return undefined;
    }

    setWalletRpcBalanceLoading(true);
    setWalletRpcBalanceError(null);

    walletRpcClient
      .readContract({
        address: TJPYC_ADDRESS,
        abi: tjpycArtifact.abi,
        functionName: "balanceOf",
        args: [myAddress as `0x${string}`],
      })
      .then((result) => {
        if (cancelled) return;
        if (typeof result === "bigint") {
          setWalletRpcBalance(result);
        } else {
          setWalletRpcBalance(null);
          setWalletRpcBalanceError("ウォレットRPCの残高形式が不正です。");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : (err as WagmiError).shortMessage ?? (err as WagmiError).message;
        setWalletRpcBalance(null);
        setWalletRpcBalanceError(message ?? "不明なエラー");
      })
      .finally(() => {
        if (cancelled) return;
        setWalletRpcBalanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [myAddress, walletRpcClient]);

  useEffect(() => {
    let cancelled = false;
    if (!walletRpcClient || !simulateEnabled || !simulateArgs || !myAddress) {
      setWalletRpcGas(null);
      setWalletRpcGasError(null);
      setWalletRpcGasLoading(false);
      return undefined;
    }

    setWalletRpcGasLoading(true);
    setWalletRpcGasError(null);

    walletRpcClient
      .estimateContractGas({
        address: TJPYC_ADDRESS,
        abi: tjpycArtifact.abi,
        functionName: "transfer",
        args: simulateArgs,
        account: myAddress as `0x${string}`,
      })
      .then((result) => {
        if (cancelled) return;
        if (typeof result === "bigint") {
          setWalletRpcGas(result);
        } else {
          setWalletRpcGas(null);
          setWalletRpcGasError("ウォレットRPCのガス見積もり形式が不正です。");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : (err as WagmiError).shortMessage ?? (err as WagmiError).message;
        setWalletRpcGas(null);
        setWalletRpcGasError(message ?? "不明なエラー");
      })
      .finally(() => {
        if (cancelled) return;
        setWalletRpcGasLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [myAddress, simulateArgs, simulateEnabled, walletRpcClient]);

  useEffect(() => {
    let cancelled = false;
    if (!publicClient || !simulateEnabled || !simulateArgs || !myAddress) {
      setGasEstimate(null);
      setGasEstimateError(null);
      setGasEstimateLoading(false);
      return undefined;
    }

    setGasEstimateLoading(true);
    setGasEstimateError(null);

    publicClient
      .estimateContractGas({
        address: TJPYC_ADDRESS,
        abi: tjpycArtifact.abi,
        functionName: "transfer",
        args: simulateArgs,
        account: myAddress as `0x${string}`,
      })
      .then((gas) => {
        if (cancelled) return;
        setGasEstimate(gas);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : (err as WagmiError).shortMessage ?? (err as WagmiError).message;
        setGasEstimate(null);
        setGasEstimateError(message ?? "不明なエラー");
      })
      .finally(() => {
        if (cancelled) return;
        setGasEstimateLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [myAddress, publicClient, simulateArgs, simulateEnabled]);

  const simulateErrorMessage = useMemo(() => {
    if (!simulateError) return null;
    const err = simulateError as WagmiError;
    return err.shortMessage ?? err.message ?? "不明なエラー";
  }, [simulateError]);

  const switchChainErrorMessage = useMemo(() => {
    if (!switchChainError) return null;
    const err = switchChainError as WagmiError;
    return err.shortMessage ?? err.message ?? "不明なエラー";
  }, [switchChainError]);

  const tokenBalanceValue = useMemo(() => {
    return typeof tokenBalance === "bigint" ? tokenBalance : undefined;
  }, [tokenBalance]);

  const tokenBalanceDisplay = useMemo(() => {
    if (tokenBalanceValue === undefined) return "-";
    return formatUnits(tokenBalanceValue, TJPYC_DECIMALS);
  }, [tokenBalanceValue]);

  const walletRpcBalanceDisplay = useMemo(() => {
    if (walletRpcBalance === null) return "-";
    return formatUnits(walletRpcBalance, TJPYC_DECIMALS);
  }, [walletRpcBalance]);

  const nativeBalanceDisplay = useMemo(() => {
    if (!nativeBalance) return "-";
    return `${formatUnits(nativeBalance.value, nativeBalance.decimals)} ${nativeBalance.symbol}`;
  }, [nativeBalance]);

  const precheckIssues = useMemo(() => {
    const issues: string[] = [];
    if (chainMismatch) {
      issues.push("Polygon Amoy に切り替えてください。");
    }
    if (walletAccountMismatch) {
      issues.push("ウォレットで選択中のアカウントが一致しません。再接続してください。");
    }
    if (to && !toIsValid) {
      issues.push("送金先アドレスが正しくありません。");
    }
    if (amount && !parsedAmount) {
      issues.push("送金額の形式が正しくありません。");
    }
    if (parsedAmount && tokenBalanceValue !== undefined && tokenBalanceValue < parsedAmount) {
      issues.push("tJPYC 残高が不足しています。");
    }
    if (parsedAmount && walletRpcBalance !== null && walletRpcBalance < parsedAmount) {
      issues.push("MetaMask RPC 側の tJPYC 残高が不足しています。");
    }
    if (nativeBalance?.value !== undefined && nativeBalance.value === 0n) {
      issues.push("MATIC 残高が不足しています。");
    }
    if (switchChainErrorMessage) {
      issues.push(`チェーン切り替え失敗: ${switchChainErrorMessage}`);
    }
    if (gasEstimateError) {
      issues.push(`ガス見積もり失敗: ${gasEstimateError}`);
    }
    if (walletAccountsError) {
      issues.push(`ウォレットアカウント取得失敗: ${walletAccountsError}`);
    }
    if (walletRpcBalanceError) {
      issues.push(`MetaMask RPC 残高取得失敗: ${walletRpcBalanceError}`);
    }
    if (walletRpcGasError) {
      issues.push(`MetaMask RPC ガス見積もり失敗: ${walletRpcGasError}`);
    }
    if (simulateEnabled && simulateErrorMessage) {
      issues.push(`simulate 失敗: ${simulateErrorMessage}`);
    }
    return issues;
  }, [
    amount,
    chainMismatch,
    gasEstimateError,
    walletAccountMismatch,
    walletAccountsError,
    walletRpcBalance,
    walletRpcBalanceError,
    walletRpcGasError,
    nativeBalance?.value,
    parsedAmount,
    simulateEnabled,
    simulateErrorMessage,
    switchChainErrorMessage,
    to,
    toIsValid,
    tokenBalanceValue,
  ]);

  const REQUIRED_PASSWORD = process.env.NEXT_PUBLIC_INTERNAL_PASSWORD;

  async function refreshWalletAccounts(request: boolean) {
    if (!ethereumProvider) return [];
    setWalletAccountsLoading(true);
    setWalletAccountsError(null);
    try {
      const method = request ? "eth_requestAccounts" : "eth_accounts";
      const result = await ethereumProvider.request({ method });
      const accounts = Array.isArray(result) ? (result as string[]) : [];
      setWalletAccounts(accounts);
      return accounts;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as WagmiError).shortMessage ?? (err as WagmiError).message;
      setWalletAccounts([]);
      setWalletAccountsError(message ?? "不明なエラー");
      return [];
    } finally {
      setWalletAccountsLoading(false);
    }
  }

  async function forceReconnect() {
    try {
      await disconnectAsync();
    } catch (err) {
      console.warn("disconnect failed", err);
    }
    const data = await connectAsync({ connector: injectedConnector, chainId: polygonAmoy.id });
    setWalletAccounts([...data.accounts]);
    return data;
  }

  async function sendOffer() {
    if (!hasEthereum) {
      alert("Brave Walletをインストールしてから送信してください");
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

    if (!to || !amount) {
      alert("送金先と金額は必須です");
      return;
    }

    if (!toIsValid) {
      alert("送金先アドレスが正しくありません");
      return;
    }

    if (!parsedAmount) {
      alert("送金額が正しくありません");
      return;
    }

    let connectedAccounts: readonly string[] = [];
    let connectedChainId = activeChainId;
    try {
      const data = await forceReconnect();
      connectedAccounts = data.accounts;
      connectedChainId = data.chainId;
    } catch (err) {
      alert("ウォレットへの接続に失敗しました。Brave Walletを確認してください。");
      console.warn("connect failed", err);
      return;
    }

    const selectedAccount = connectedAccounts[0];
    if (!selectedAccount) {
      alert("ウォレットのアカウントが取得できません。再接続してください。");
      return;
    }

    if (profileAddress && selectedAccount.toLowerCase() !== profileAddress.toLowerCase()) {
      alert("プロフィールのウォレットと接続中のウォレットが一致しません");
      return;
    }

    if (connectedChainId !== polygonAmoy.id) {
      try {
        await switchChainAsync({ chainId: polygonAmoy.id });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : (err as WagmiError).shortMessage ?? (err as WagmiError).message;
        alert(
          `Polygon Amoy への切り替えに失敗しました。Brave Walletで切り替えてください。\n${message ?? ""}`
        );
      }
      return;
    }

    const shouldCheckBalance =
      myAddress && selectedAccount.toLowerCase() === myAddress.toLowerCase();
    if (shouldCheckBalance && tokenBalanceValue !== undefined && tokenBalanceValue < parsedAmount) {
      alert("tJPYC 残高が不足しています");
      return;
    }

    if (nativeBalance?.value !== undefined && nativeBalance.value === 0n) {
      alert("MATIC 残高が不足しています");
      return;
    }

    const weiAmount = parsedAmount;
    const rawGas = walletRpcGas ?? gasEstimate;
    const baseGas = rawGas ?? 100_000n;
    const gasLimit = baseGas < 100_000n ? 100_000n : (baseGas * 120n) / 100n;

    try {
      if (!walletClient) {
        alert("Brave Walletが見つかりません。ブラウザ拡張を確認してください。");
        return;
      }
      setIsSending(true);
      const calldata = encodeFunctionData({
        abi: tjpycArtifact.abi,
        functionName: "transfer",
        args: [to, weiAmount],
      });
      const nonce = walletRpcClient
        ? await walletRpcClient.getTransactionCount({
          address: selectedAccount as `0x${string}`,
          blockTag: "pending",
        })
        : undefined;
      const feeClient = walletRpcClient ?? publicClient;
      const fees = feeClient ? await feeClient.estimateFeesPerGas() : null;
      const hash = await walletClient.sendTransaction({
        account: selectedAccount as `0x${string}`,
        to: TJPYC_ADDRESS,
        data: calldata,
        gas: gasLimit,
        nonce,
        maxFeePerGas: fees?.maxFeePerGas ?? undefined,
        maxPriorityFeePerGas: fees?.maxPriorityFeePerGas ?? undefined,
      });

      setTxHash(hash);
      await disconnectAsync(); // 送信後は明示的に切断する
    } catch (error: unknown) {
      // unknown を受け取り、型ガードで Error を絞る
      if (error instanceof BaseError) {
        console.error("sendOffer error (BaseError)", error);
        const details = error.details ? `\n${error.details}` : "";
        const meta = error.metaMessages?.length ? `\n${error.metaMessages.join("\n")}` : "";
        alert(`送金エラー: ${error.shortMessage}${meta}${details}`);
      } else if (error instanceof Error) {
        console.error("sendOffer error (Error)", error);
        alert(`送金エラー: ${error.message}`);
      } else {
        const e = error as WagmiError;
        console.error("sendOffer error (unknown)", e);
        alert(`送金エラー: ${e.shortMessage ?? e.message ?? "不明なエラー"}`);
      }
    } finally {
      setIsSending(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-sky-100 p-6 text-gray-900">
        <div className="max-w-xl mx-auto">
          <BackToDashboard href="/company/dashboard" />
          <p className="text-gray-600 mt-4">読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-100 p-6 text-gray-900">
      <div className="max-w-xl mx-auto">

        <BackToDashboard href="/company/dashboard" />

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🎁 学生へオファーを送る
        </h1>

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
        {threadId && (
          <p className="text-sm text-gray-700">
            ひも付くスレッド: {threadId}
          </p>
        )}
        {mismatch && (
          <p className="text-red-600 font-semibold">
            プロフィールのウォレットと接続中のウォレットが一致しません。MetaMaskでアカウントを切り替えてください。
          </p>
        )}

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

            <div className="border rounded-xl bg-gray-50 p-4 space-y-2">
              <p className="font-semibold">事前チェック</p>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  チェーン:{" "}
                  {chainMismatch ? "NG" : "OK"}{" "}
                  {activeChainId ? `(chainId: ${activeChainId})` : "(未取得)"}
                </p>
                {chainMismatch && (
                  <button
                    type="button"
                    onClick={() => switchChainAsync({ chainId: polygonAmoy.id })}
                    className="mt-1 inline-flex items-center rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-300"
                    disabled={isSwitchingChain}
                  >
                    {isSwitchingChain ? "切り替え中..." : "Amoy に切り替え"}
                  </button>
                )}
                <p>
                  ウォレット選択アカウント:{" "}
                  {walletAccountsLoading
                    ? "取得中..."
                    : walletSelectedAddress ?? "未取得"}
                </p>
                {walletAccountMismatch && (
                  <button
                    type="button"
                    onClick={() => refreshWalletAccounts(true)}
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

            <button
              onClick={sendOffer}
              disabled={
                isSending ||
                isConnecting ||
                isSwitchingChain ||
                hasEthereum === false ||
                chainMismatch
              }
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
            >
              {isSending || isConnecting ? "送信中..." : "オファーを送る"}
            </button>

            {/* 結果 */}
            {txHash && (
              <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl">
                <p className="font-semibold text-green-800">
                  オファーを送信しました！
                </p>
                <a
                  href={`https://amoy.polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  トランザクションを見る →
                </a>
              </div>
            )}

          </div>
      </div>

      {/* 直近面談した学生の候補 */}
      <div className="max-w-xl mx-auto mt-6 bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3">🧭 直近面談した学生</h2>
        <div className="space-y-2">
          {recentInterviewees.map((r) => (
            <div
              key={r.thread_id}
              className="border rounded-lg p-3 flex items-center justify-between gap-2"
            >
              <div>
                <p className="font-semibold">{r.student_name ?? "学生"}</p>
                <p className="text-xs text-gray-600 break-all">
                  {r.student_wallet ?? "ウォレット未登録"}
                </p>
                <p className="text-xs text-gray-500">
                  面談日時: {new Date(r.happened_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  if (r.student_wallet) setTo(r.student_wallet);
                  setThreadId(r.thread_id);
                }}
                className="text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-2 rounded-lg hover:opacity-90"
              >
                宛先にセット
              </button>
            </div>
          ))}
          {companyId && recentInterviewees.length === 0 && (
            <p className="text-sm text-gray-600">直近の面談データがありません。</p>
          )}
        </div>
      </div>
    </main>
  );
}
