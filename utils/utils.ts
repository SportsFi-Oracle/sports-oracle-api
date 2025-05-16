import { ethers } from "ethers";
import { RPC_URL } from "./config";
import { Token } from "@uniswap/sdk-core";

export const readProvider = new ethers.JsonRpcProvider(RPC_URL);
export const writeProvider = new ethers.JsonRpcProvider("https://rpc.toronto.sx.technology"); // Adjust if different network
export const getSigner = (privateKey: string) => new ethers.Wallet(privateKey, writeProvider);

export interface PoolMetadata {
    addr: string;
    dec0: number;
    dec1: number;
    token0: Token,
    token1: Token,
    invert: boolean;
  }

  export interface Observation {
    secondsAgo: number
    tickCumulative: bigint
    secondsPerLiquidityCumulativeX128: bigint
  }
  