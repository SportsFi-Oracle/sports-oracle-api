import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

// Load environment variables
export const RPC_URL = process.env.RPC_URL; // RPC URL for SX Network or Testnet
export const PRIVATE_KEY = process.env.PRIVATE_KEY; // Private key of the account that deployed the oracle contract   
export const ORACLE_CONTRACT_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS; // Deployed SXPriceOracle contract address
export const ORACLE_ABI = [
  "function getPrice(string memory asset) public view returns (uint256)",
  "function lastUpdated() public view returns (uint256)"
];

// Setup ethers provider and contract instance
export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const oracleContract = new ethers.Contract(ORACLE_CONTRACT_ADDRESS, ORACLE_ABI, provider);
