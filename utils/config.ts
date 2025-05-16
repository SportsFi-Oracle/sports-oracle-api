import dotenv from "dotenv";
import { PoolMetadata } from "./utils";
import { Token } from "@uniswap/sdk-core";
dotenv.config();

export const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
export const RPC_URL = process.env.RPC_URL || "";
export const ORACLE_CONTRACT_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS || "";
export const TASK_INTERVAL_MS = 45_000;
export const THRESHOLD = 0.001;
export const FORCE_AFTER_MS = 10 * 60_000;
export const DECIMALS_ONCHAIN = 8;

// All tokens
export const WBTC_TOKEN: Token = new Token(1, "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", 8, "WBTC", "Wrapped BTC");
export const WETH_TOKEN: Token = new Token(1, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18, "WETH", "Wrapped Ether");
export const USDC_TOKEN: Token = new Token(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6, "USDC", "USDC");
export const USDT_TOKEN: Token = new Token(1, "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6, "USDT", "Tether USD");
export const WSX_TOKEN: Token = new Token(1, "0xbe9F61555F50DD6167f2772e9CF7519790d96624", 18, "SX", "SX Network");

export const POOLS: Record<string, PoolMetadata> = {
  WETH:  { addr: "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8", dec0: 6,  dec1: 18, token0: USDC_TOKEN, token1: WETH_TOKEN, invert: true  }, // USDC / ETH
  USDC: { addr: "0x3416cf6c708da44db2624d63ea0aaef7113527c6", dec0: 6,  dec1: 6, token0: USDC_TOKEN, token1: USDT_TOKEN, invert: false }, // USDC / USDT (price ≈1)
  SX:   { addr: "0xCb3b931E1e02C26399aCc651bFD9c8c4385EECd0", dec0: 18, dec1: 6, token0: USDC_TOKEN, token1: WSX_TOKEN, invert: false }, // USDC / SX
};