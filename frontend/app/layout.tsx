"use client";

import "./globals.css";
import { WagmiProvider, createConfig, http } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletAutoDisconnect } from "@/components/wallet/WalletAutoDisconnect";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [polygonAmoy],
  connectors: [injected()],
  transports: {
    [polygonAmoy.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 
      process.env.NEXT_PUBLIC_AMOY_RPC_URL ||
      undefined
    ),
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <WalletAutoDisconnect />
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
