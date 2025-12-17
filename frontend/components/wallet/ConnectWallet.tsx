"use client";

import { useConnection } from "wagmi";
import { WalletOptions } from "@/components/wallet/WalletOption";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { Children, isValidElement, ReactNode, useEffect, useState } from "react";

interface ConnectWalletProps {
  children?: ReactNode,
  showDefault?: boolean;
}

export function ConnectWallet({ children, showDefault = true }: ConnectWalletProps) {
  const { isConnected } = useConnection()
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (children) {
    const childrenArray = Children.toArray(children);
    const connectedChildren: ReactNode[] = [];
    const disconnectedChildren: ReactNode[] = [];

    childrenArray.forEach((child) => {
      if (isValidElement(child)) {
        const walletState = (child.props as { "data-wallet"?: string })["data-wallet"];
        if (walletState === "connected") {
          connectedChildren.push(child);
        } else if (walletState === "disconnected") {
          disconnectedChildren.push(child);
        }
      }
    })
    
    if (isConnected) {
      return (
        <>
          {connectedChildren}
          {showDefault ? <ConnectButton /> : null}
        </>
      )
    } else {
      return (
        <>
          {disconnectedChildren}
          {showDefault ? <WalletOptions /> : null}
        </>
      )
    }
  }
  if (isConnected) {
    return showDefault ? <ConnectButton /> : null;
  }
  return showDefault ? <WalletOptions /> : null;
}