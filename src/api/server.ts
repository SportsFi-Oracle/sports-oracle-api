import express, { Request, Response } from "express";
import cors from "cors";
import { OracleManager } from "../oracles/OraclesManager";
import { POOLS } from "../../utils/config";
import { ethers } from "ethers";

const app = express();
app.use(cors());


const PORT = process.env.PORT || 4004;

// Initialize your OracleManager; it instantiates UniswapOracle for each asset in POOLS
const oracleManager = new OracleManager();
const oracles = oracleManager.getOracles();

// Root endpoint – simple status check
app.get("/", (req: Request, res: Response) => {
    res.json({
      status: "API is running",
      message: "Welcome to the SportsFi Oracle API.",
    });
  });

  // API status endpoint
app.get("/api/status", (req: Request, res: Response) => {
    res.json({ status: "API is running" });
  });

// Fetch latest prices for all assets using our oracles.
// We call each UniswapOracle.getLatestPriceInUsd and return a nicely formatted result.
app.get("/api/prices", async (req: Request, res: Response) => {
    try {
      const assets = Object.keys(POOLS);
      const prices: Record<string, number | string> = {};
  
      // You might want to run these requests concurrently with Promise.all
      await Promise.all(
        assets.map(async (asset) => {
          try {
            const price = await oracles[asset].getLatestPriceInUsd();
            prices[asset] = price;
          } catch (err: any) {
            console.error(`Error fetching price for ${asset}:`, err.message);
            prices[asset] = "Error fetching price";
          }
        })
      );
  
      // If your on-chain oracle contract supports a lastUpdated() method, try to retrieve it
      let lastUpdated = null;
      try {
        // For example, if you would call oracleContract.lastUpdated() from your OracleManager.
        // (You may need to add a getter in OracleManager if oracleContract is private.)
        lastUpdated = await oracleManager['oracleContract'].lastUpdated();
        lastUpdated = new Date(Number(lastUpdated) * 1000).toISOString();
      } catch (err: any) {
        console.error("Error fetching last update timestamp:", err.message);
        lastUpdated = "Error fetching timestamp";
      }
  
      res.json({ prices, lastUpdated });
    } catch (error: any) {
      console.error("Error in /api/prices:", error.message);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });
  
  // Fetch a specific asset's price.
  app.get("/api/prices/:asset", async (req: Request, res: Response) => {
    const asset = req.params.asset.toUpperCase();
    try {
      if (!oracles[asset])
        throw new Error(`Asset ${asset} is not supported`);
  
      const price = await oracles[asset].getLatestPriceInUsd();
      res.json({ asset, price });
    } catch (error: any) {
      console.error(`Error fetching price for ${asset}:`, error.message);
      res.status(500).json({ error: `Failed to fetch price for ${asset}` });
    }
  });
  
  // Start server if not in test mode
  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
  
  export default app;