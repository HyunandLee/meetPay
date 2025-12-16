import { useEffect, useState } from "react";
import { Connector, useConnect, useConnectors } from "wagmi";

interface WalletOptionProps {
  connector: Connector;
  onClick: () => void;
}

export function WalletOptions() {
  const { connect } = useConnect();
  const connectors = useConnectors();

  return connectors.map((connector) => (
    <WalletOption
      key={connector.uid}
      connector={connector}
      onClick={() => connect({ connector })}
    />
  ))
}

function WalletOption({ connector, onClick }: WalletOptionProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <button className="w-full py-3 my-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition" disabled={!ready} onClick={onClick}>
      {connector.name}
    </button>
  )
}