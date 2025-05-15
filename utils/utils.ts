import { ethers } from "ethers";
import { RPC_URL } from "./config";

export const readProvider = new ethers.JsonRpcProvider(RPC_URL);
export const writeProvider = new ethers.JsonRpcProvider(RPC_URL); // Adjust if different network
export const getSigner = (privateKey: string) => new ethers.Wallet(privateKey, writeProvider);