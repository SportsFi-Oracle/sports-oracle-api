import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

// Load environment variables
const RPC_URL = process.env.RPC_URL; // RPC URL for SX Network or Testnet
const ORACLE_CONTRACT_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS; // Deployed SXPriceOracle contract address
const ORACLE_ABI = [
  "function getPrice(string memory asset) public view returns (uint256)",
  "function lastUpdated() public view returns (uint256)"
];

// Setup ethers provider and contract instance
const provider = new ethers.JsonRpcProvider(RPC_URL);
const oracleContract = new ethers.Contract(ORACLE_CONTRACT_ADDRESS, ORACLE_ABI, provider);


export default oracleContract;