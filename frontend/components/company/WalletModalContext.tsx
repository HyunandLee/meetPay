"use client";

import { createContext, useContext, useRef, useEffect } from "react";
import { useConnection } from "wagmi";
import { ConnectWallet } from "../wallet/ConnectWallet";

export interface WalletModalProviderProps {
  children: React.ReactNode;
}

export interface WalletModalContextType {
  openModal: () => void;
}

const WalletModalContext = createContext<WalletModalContextType | undefined>(undefined);

export function WalletModalProvider({ children }: WalletModalProviderProps) {
  const loginDialogRef = useRef<HTMLDialogElement>(null);
  const { isConnected } = useConnection();

  const openModal = () => loginDialogRef.current?.showModal();

  // ウォレット接続成功時にモーダルを自動的に閉じる
  useEffect(() => {
    if (isConnected && loginDialogRef.current?.open) {
      loginDialogRef.current.close();
    }
  }, [isConnected]);

  return (
    <WalletModalContext.Provider value={{ openModal }}>
      {children}

      <dialog 
        ref={loginDialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-md w-full"
      >
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold dark:text-white">
            Connect Wallet
          </h2>
          <ConnectWallet>
            <div data-wallet="connected">
              <p className="text-green-500">Connected</p>
            </div>
            <div data-wallet="disconnected">
              <p className="text-red-500">Disconnected</p>
            </div>
          </ConnectWallet>
          <button
            onClick={() => loginDialogRef.current?.close()}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white"
          >
            閉じる
          </button>
        </div>
      </dialog>
    </WalletModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(WalletModalContext);
  if (!context) {
    throw new Error("useModal must be used within a WalletModalProvider");
  }
  return context;
}