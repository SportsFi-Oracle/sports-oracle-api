import dotenv from "dotenv";
dotenv.config();

export const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
export const RPC_URL = process.env.RPC_URL || "";
export const ORACLE_CONTRACT_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS || "";
export const TASK_INTERVAL_MS = 45_000;
export const THRESHOLD = 0.001;
export const FORCE_AFTER_MS = 10 * 60_000;
export const DECIMALS_ONCHAIN = 8;