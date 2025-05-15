import { UniswapOracle, POOLS, PoolMetadata } from "./UniswapOracles";
import { Contract, ethers, BigNumberish } from "ethers";
import { getSigner, readProvider, writeProvider } from "../../utils/utils";
import { PRIVATE_KEY, TASK_INTERVAL_MS, THRESHOLD, FORCE_AFTER_MS, DECIMALS_ONCHAIN, ORACLE_CONTRACT_ADDRESS } from "../../utils/config";

const ORACLE_ABI = [
  "function updatePrice(string asset, uint256 price) public"
];

export class OracleManager {
  private signer = getSigner(PRIVATE_KEY);
  private oracleContract: Contract;
  private oracles: Record<string, UniswapOracle> = {};

  constructor() {
    this.oracleContract = new ethers.Contract(ORACLE_CONTRACT_ADDRESS, ORACLE_ABI, this.signer);
    // Instantiate each oracle from POOLS metadata
    for (const asset in POOLS) {
      this.oracles[asset] = new UniswapOracle(asset, POOLS[asset]);
    }
  }

  // Format price to uint on-chain scale
  public toOnchainUint(price: number): BigNumberish {
    // Adjust conversion as needed; this uses toLocaleString to avoid scientific notation.
    const priceStr = price.toLocaleString("fullwide", { useGrouping: false });
    return ethers.parseUnits(priceStr, DECIMALS_ONCHAIN);
  }

  // Update one asset price on the oracle contract
  public async updateOne(asset: string): Promise<void> {
    const oracle = this.oracles[asset];
    const price = await oracle.fetchTwapPrice();
    const priceUint = this.toOnchainUint(price);
    // You can add thresholds and stale check here as needed.
    const tx = await this.oracleContract.updatePrice(asset, priceUint, { gasLimit: 150_000 });
    await tx.wait();
    console.log(`[${new Date().toISOString()}] → ${asset} updated to ${price.toFixed(8)}`);
  }

  // Run update for all assets
  public async runCycle(): Promise<void> {
    await Promise.all(Object.keys(this.oracles).map(asset => this.updateOne(asset)));
  }

  // Start periodic updates
  public start(): void {
    this.runCycle(); // initial run
    setInterval(() => this.runCycle(), TASK_INTERVAL_MS);
  }
}