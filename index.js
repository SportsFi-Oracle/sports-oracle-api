require("dotenv").config();

const express = require("express")
const cors = require("cors")
const { ethers } = require("ethers")

// Initialize server
const app = express();
app.use(cors());
app.use(express.json());


// Load env variables

const PORT = process.env.PORT || 4004;
const RPC_URL = process.env.RPC_URL;
const AX_USDC_POOL = process.env.AX_USDC_POOL;
const SX_USDC_POOL = process.env.SX_USDC_POOL;

// Setup ethers provider
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Uniswap V3 Pool ABI
const UNISWAP_POOL_ABI = [
    "function observe(uint32[] secondsAgos) external view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128)",
    "function liquidity() external view returns (uint128)"
  ];

  // Helper to calculate TWAP from ticks
const calculateTwap = (tickCumulatives, period) => {
    const tick = (tickCumulatives[1] - tickCumulatives[0]) / period;
    return Math.pow(1.0001, tick) * 1e6; // Price as a multiplier (e.g., USDC = 1e6)
  };
  
  // Fetch TWAP Price
  const fetchTwap = async (poolAddress) => {
    const poolContract = new ethers.Contract(poolAddress, UNISWAP_POOL_ABI, provider);
    const secondsAgos = [60, 0]; // 60 seconds TWAP
    const [tickCumulatives] = await poolContract.observe(secondsAgos);
    return calculateTwap(tickCumulatives, 60); // 60 seconds
  };
  
  // Fetch Liquidity
  const fetchLiquidity = async (poolAddress) => {
    const poolContract = new ethers.Contract(poolAddress, UNISWAP_POOL_ABI, provider);
    const liquidity = await poolContract.liquidity();
    return liquidity.toString();
  };
  
  // Routes
  app.get("/api/prices", async (req, res) => {
    try {
      const axPrice = await fetchTwap(AX_USDC_POOL);
      const sxPrice = await fetchTwap(SX_USDC_POOL);
  
      res.json({
        AX: { price: axPrice },
        SX: { price: sxPrice }
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });
  
  app.get("/api/liquidity", async (req, res) => {
    try {
      const axLiquidity = await fetchLiquidity(AX_USDC_POOL);
      const sxLiquidity = await fetchLiquidity(SX_USDC_POOL);
  
      res.json({
        AX: { liquidity: axLiquidity },
        SX: { liquidity: sxLiquidity }
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });
  
  app.get("/api/status", (req, res) => {
    res.json({ status: "API is running" });
  });
  
  // Start server
  app.listen(PORT, () => {
    console.log(`Oracle API running on http://localhost:${PORT}`);
  });
  