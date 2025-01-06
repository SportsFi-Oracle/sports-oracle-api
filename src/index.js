import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import { oracleContract } from "../utils/index.js";

// Initialize server
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4004;


// API Status Check
app.get("/api/status", (req, res) => {
  res.json({ status: "API is running" });
});

// Fetch Latest Prices for Assets
app.get("/api/prices", async (req, res) => {
  try {
    const assets = ["BTC", "ETH", "USDT", "USDC", "SX"];
    const prices = {};

    for (const asset of assets) {
      const rawPrice = await oracleContract.getPrice(asset);
      prices[asset] = formatPrice(rawPrice, asset === "SX" ? 18 : 6); // Adjust decimals for SX token
    }

    const lastUpdated = await oracleContract.lastUpdated();
    res.json({ prices, lastUpdated: new Date(lastUpdated * 1000).toISOString() });
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// Fetch Specific Asset Price
app.get("/api/prices/:asset", async (req, res) => {
  const { asset } = req.params;
  try {
    const rawPrice = await oracleContract.getPrice(asset.toUpperCase());

    // Check if the result is valid
    if (rawPrice === "0x" || rawPrice === 0) {
      console.log(`Price error for asset: ${asset}`, rawPrice);
      throw new Error(`Price not found for asset: ${asset}`);
    }

    const price = formatPrice(rawPrice, asset.toUpperCase() === "SX" ? 18 : 6);
    res.json({ asset, price });
  } catch (error) {
    console.error(`Error fetching price for ${asset}:`, error);
    res.status(500).json({ error: `Failed to fetch price for ${asset}` });
  }
});


export default app;

// Start server if NOT  in test mode 
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}