import { useConnection, useDisconnect, useEnsAvatar, useEnsName } from "wagmi";

export function ConnectButton() {
  const { address } = useConnection();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  return (
    <div>
      <button className="w-full py-3 my-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition" onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}