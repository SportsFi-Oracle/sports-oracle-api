import { ethers } from "ethers";
import dotenv from "dotenv";

import { RPC_URL, ORACLE_CONTRACT_ADDRESS, PRIVATE_KEY } from "../utils/index.js";

dotenv.config();

/******************************
 * CONFIGURATION
 ******************************/
const TASK_INTERVAL_MS = 45_000;          // 45‑second cadence
const THRESHOLD        = 0.001;           // 0.1 % price‑change hysteresis
const FORCE_AFTER_MS   = 10 * 60_000;     // Hard refresh every 10 min
const DECIMALS_ONCHAIN = 8;               // store prices scaled ×10^8

/******************************
 * ABI DEFINITIONS
 ******************************/
const UNISWAP_POOL_ABI = [
  "function observe(uint32[]) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128)"
];

const ORACLE_ABI = [
  "function updatePrice(string asset, uint256 price) public"
];

/******************************
 * POOL METADATA
 *   dec0  – decimals of token0
 *   dec1  – decimals of token1
 *   invert – true  → return USD per asset   (1 / priceToken1PerToken0)
 *            false → return USD per asset directly (token1 per token0)
 ******************************/
const POOLS = {
  BTC:  { addr: "0x99ac8cA7087fA4A2A1FB6357269965A2014ABc35", dec0: 6,  dec1: 8,  invert: true  }, // USDC / WBTC
  ETH:  { addr: "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8", dec0: 6,  dec1: 18, invert: true  }, // USDC / ETH
  USDC: { addr: "0x3416cf6c708da44db2624d63ea0aaef7113527c6", dec0: 6,  dec1: 6,  invert: false }, // USDC / USDT (price ≈1)
  USDT: { addr: "0x3416cf6c708da44db2624d63ea0aaef7113527c6", dec0: 6,  dec1: 6,  invert: false }, // same pool, mirror asset
  SX:   { addr: "0xCb3b931E1e02C26399aCc651bFD9c8c4385EECd0", dec0: 18, dec1: 6,  invert: false }, // SX / USDC
};

/******************************
 * SINGLETON PROVIDERS & CONTRACTS
 ******************************/
const readProvider  = new ethers.JsonRpcProvider("https://eth.llamarpc.com"); //ETH MAINNET
const writeProvider = new ethers.JsonRpcProvider('https://rpc.toronto.sx.technology'); //SX Testnet
const signer        = new ethers.Wallet(PRIVATE_KEY, writeProvider);

// Cache pool contracts
const poolContracts = Object.fromEntries(
  Object.entries(POOLS).map(([asset, meta]) => [
    asset,
    new ethers.Contract(meta.addr, UNISWAP_POOL_ABI, readProvider),
  ])
);

const oracleContract = new ethers.Contract(ORACLE_CONTRACT_ADDRESS, ORACLE_ABI, signer);

/******************************
 * STATE
 ******************************/
const lastPrice  = {}; // asset ⇒ number (floating, human‑readable)
const lastWrite  = {}; // asset ⇒ epoch ms

/******************************
 * HELPERS
 ******************************/
const tickToPrice = (tick, dec0, dec1, invert = false) => {
  const ratio = Math.pow(1.0001, tick);
  let price = ratio * 10 ** (dec1 - dec0);
  if (invert) price = 1 / price;
  return price;
};

const fetchTwapPrice = async (asset, contract, period = 60) => {
  const meta = POOLS[asset];
  const secondsAgos = [period, 0];
  const [tickCumulatives] = await contract.observe(secondsAgos);
  const tick = Number((tickCumulatives[1] - tickCumulatives[0]) / BigInt(period));
  return tickToPrice(tick, meta.dec0, meta.dec1, meta.invert);
};

const toOnchainUint = (price) => ethers.parseUnits(price.toFixed(DECIMALS_ONCHAIN), DECIMALS_ONCHAIN);

/******************************
 * CORE UPDATE LOGIC
 ******************************/
async function updateOne([asset, contract]) {
  try {
    const price = await fetchTwapPrice(asset, contract);          // ← floating number

    const prev       = lastPrice[asset] ?? price; // init with current to avoid div by 0
    const changePct  = Math.abs((price - prev) / price);
    const now        = Date.now();
    const isStale    = (now - (lastWrite[asset] ?? 0)) > FORCE_AFTER_MS;

    if (changePct < THRESHOLD && !isStale) return; // skip insignificant updates

    const priceUint = toOnchainUint(price);
    const tx = await oracleContract.updatePrice(asset, priceUint, { gasLimit: 150_000 });
    await tx.wait();

    lastPrice[asset] = price;
    lastWrite[asset] = now;
    console.log(`[${new Date().toISOString()}] → ${asset} updated to ${price.toFixed(8)}`);
  } catch (err) {
    console.error(`Error updating ${asset}:`, err);
  }
}

async function runCycle() {
  await Promise.all(Object.entries(poolContracts).map(updateOne));
}

/******************************
 * BOOTSTRAP
 ******************************/
(async function bootstrap() {
  try {
    const network = await writeProvider.getNetwork();
    console.log(`Connected to ${network.name} (chainId ${network.chainId})`);
    console.log("Starting oracle updater…\n");
  } catch (e) {
    console.error("Network connection failed.", e);
    process.exit(1);
  }

  runCycle();
  setInterval(runCycle, TASK_INTERVAL_MS);
})();
