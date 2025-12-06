import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
import fs from "fs";

dotenvConfig();

const pk = process.env.PRIVATE_KEY;
const rpcUrl = process.env.SEPOLIA_RPC_URL;

if (!rpcUrl || !pk) {
    throw new Error("POLYGON_AMOY_RPC_URL または PRIVATE_KEY が .env にありません");
  }

// 1. RPC & Wallet 準備
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(pk, provider);

async function main() {
  console.log("Deploying with wallet:", await wallet.getAddress());

  // 2. アーティファクト読み込み
  const artifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/TestJPYC.sol/TestJPYC.json", "utf8")
  );

  // 3. ContractFactory 作成
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  // 4. デプロイ（初期Supply 100万）
  const initialSupply = ethers.parseUnits("1000000", 18);

  console.log("Deploying TestJPYC...");
  const contract = await factory.deploy(initialSupply);

  // 5. マイニング待ち
  await contract.waitForDeployment();

  console.log("TestJPYC deployed at:", await contract.getAddress());
}

main().catch(console.error);

