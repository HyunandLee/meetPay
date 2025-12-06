import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createPublicClient, http } from "viem";
import { polygonAmoy } from "viem/chains";

// __dirname を ESM 風に再現
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// JSON を fs で読み込む
const abiPath = join(__dirname, "../frontend/abi/tjpyc.json");
const tjpycArtifact = JSON.parse(readFileSync(abiPath, "utf8"));

const client = createPublicClient({
  chain: polygonAmoy,
  transport: http(process.env.POLYGON_AMOY_RPC_URL),
});

async function main() {
  const decimals = await client.readContract({
    address: "0x6A443d0e480E1053b055AdA12901DADe41b165a3",
    abi: tjpycArtifact.abi,
    functionName: "decimals",
  });

  console.log("decimals =", decimals);
}

main();
