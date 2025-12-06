import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { ethers } from "ethers";
import fs from "fs";

async function main() {
  // 1. プロバイダ & ウォレット設定
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("POLYGON_AMOY_RPC_URL または PRIVATE_KEY が .env にありません");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying with wallet:", await wallet.getAddress());

  // 2. コンパイル済みアーティファクトを読む
  const artifact = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/TestJPYC.sol/TestJPYC.json",
      "utf8"
    )
  );

  // 3. ContractFactory を作成
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  // 4. 初期供給量（100万 tJPYC）
  const initialSupply = ethers.parseUnits("1000000", 18);

  console.log("Deploying TestJPYC to Polygon Amoy...");

  const token = await factory.deploy(initialSupply);
  await token.waitForDeployment();

  console.log("TestJPYC deployed at:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

