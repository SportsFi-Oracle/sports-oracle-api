import { ethers } from "ethers";
import dotenv from "dotenv";

import { RPC_URL, ORACLE_CONTRACT_ADDRESS, PRIVATE_KEY } from "../utils/index.js";

dotenv.config();

// Uniswap V3 Pool ABI
const UNISWAP_POOL_ABI = [
  "function observe(uint32[] calldata secondsAgos) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128)"
];

// Oracle Contract ABI
const ORACLE_ABI = [
  "function updatePrice(string memory asset, uint256 price) public"
];

// Uniswap V3 Pool Addresses
const POOLS = {
  BTC: "0x99ac8cA7087fA4A2A1FB6357269965A2014ABc35", // WBTC/USDC pool on Ethereum (0.3% fee)
  ETH: "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8", // ETH/USDC pool on Ethereum (0.3% fee)
  USDC: "0x3416cf6c708da44db2624d63ea0aaef7113527c6", // USDC/USDT pool on Ethereum (0.01% fee)
  USDT: "0x3416cf6c708da44db2624d63ea0aaef7113527c6", // USDT/USDC pool on Ethereum (0.01% fee)
  SX: "0xCb3b931E1e02C26399aCc651bFD9c8c4385EECd0", // SX/USDC pool on Ethereum (0.3% fee)
};

// Helper to calculate TWAP
const calculateTwap = (tickCumulatives, period) => {
  const periodBigInt = BigInt(period);
  const tick = Number((tickCumulatives[1] - tickCumulatives[0]) / periodBigInt);
  return Math.pow(1.0001, tick) * 1e6; // Price multiplier for USDC
};

// Fetch TWAP from Uniswap V3
const fetchTwap = async (poolAddress) => {
    const provider = new ethers.JsonRpcProvider("https://cloudflare-eth.com");
    try {
    const poolContract = new ethers.Contract(poolAddress, UNISWAP_POOL_ABI, provider);
    const secondsAgos = [60, 0]; // 60-second TWAP
    console.log(`Fetching TWAP for pool: ${poolAddress}`);
    
    const [tickCumulatives] = await poolContract.observe(secondsAgos);
    console.log(`Tick cumulatives for pool ${poolAddress}:`, tickCumulatives);
    return calculateTwap(tickCumulatives, 60);
  } catch (error) {
    console.error(`Error fetching TWAP for pool ${poolAddress}:`, error);
    throw error;
  }
};

// Real-time updater function
const updateOracle = async () => {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Validate network connectivity
  try {
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
  } catch (error) {
    console.error("Error connecting to network:", error);
    process.exit(1);
  }

  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const oracleContract = new ethers.Contract(ORACLE_CONTRACT_ADDRESS, ORACLE_ABI, signer);

  while (true) {
    console.log("Starting price fetch from Uniswap...");
    try {
      for (const [asset, poolAddress] of Object.entries(POOLS)) {
        try {
          const price = await fetchTwap(poolAddress);
          console.log(`Fetched price for ${asset}: ${price}`);

          // Update the oracle contract
          const tx = await oracleContract.updatePrice(asset, Math.floor(price), {
            gasLimit: 500000, // Adjust as needed
          });
          await tx.wait();
          console.log(`Updated price for ${asset} in the oracle.`);
        } catch (error) {
          console.error(`Error processing ${asset}:`, error);
        }
      }
    } catch (error) {
      console.error("Error during the main price fetching loop:", error);
    }

    console.log("Waiting 60 seconds before the next update...");
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait for 60 seconds
  }
};

// Start the updater
updateOracle().catch((error) => {
  console.error("Critical error in real-time updater:", error);
  process.exit(1);
});
