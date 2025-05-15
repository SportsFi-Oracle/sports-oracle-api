import { Contract } from "ethers";
import { readProvider } from "../../utils/utils";
import { ORACLE_CONTRACT_ADDRESS } from "../../utils/config";

// Define ABI for the Uniswap pool, update as needed
const UNISWAP_POOL_ABI = [
  "function observe(uint32[]) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128)"
];

// Define pool metadata
export interface PoolMetadata {
  addr: string;
  dec0: number;
  dec1: number;
  invert: boolean;
}

// Example pool definitions
export const POOLS: Record<string, PoolMetadata> = {
  BTC:  { addr: "0x99ac8cA7087fA4A2A1FB6357269965A2014ABc35", dec0: 6, dec1: 8, invert: true },
  // add other pools
};

export class UniswapOracle {
  public poolContract: Contract;
  
  constructor(public asset: string, public metadata: PoolMetadata) {
    this.poolContract = new Contract(metadata.addr, UNISWAP_POOL_ABI, readProvider);
  }

  // Custom tickToPrice function; replace or extend this as needed
  public tickToPrice(tick: number): number {
    const ratio = Math.pow(1.0001, tick);
    let price = ratio * 10 ** (this.metadata.dec1 - this.metadata.dec0);
    if (this.metadata.invert) price = 1 / price;
    return price;
  }

  // Get TWAP price
  public async fetchTwapPrice(period = 60): Promise<number> {
    const secondsAgos = [period, 0];
    const [tickCumulatives] = await this.poolContract.observe(secondsAgos);
    const tick = Number((tickCumulatives[1] - tickCumulatives[0]) / period);
    return this.tickToPrice(tick);
  }
}