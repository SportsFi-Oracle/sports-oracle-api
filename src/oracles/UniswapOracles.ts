import { Contract } from "ethers";
import { Pool, tickToPrice } from "@uniswap/v3-sdk";
import { Price, Token } from '@uniswap/sdk-core'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { readProvider } from "../../utils/utils";
import { ORACLE_CONTRACT_ADDRESS } from "../../utils/config";


// Define observation metadata
export interface Observation {
  secondsAgo: number
  tickCumulative: bigint
  secondsPerLiquidityCumulativeX128: bigint
}

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
    this.poolContract = new Contract(metadata.addr, IUniswapV3PoolABI.abi, readProvider);
  }

  // Custom tickToPrice function; replace or extend this as needed

  private _calculateTWAP(observations: Observation[], pool: Pool) {
    const diffTickCumulative =
      observations[0].tickCumulative - observations[1].tickCumulative
    const secondsBetween = observations[1].secondsAgo - observations[0].secondsAgo
  
    const averageTick = Number(diffTickCumulative / BigInt(secondsBetween))
  
    return tickToPrice(pool.token0, pool.token1, averageTick)
  }
  private _calculateTWAL(observations: Observation[]): bigint {
    const diffSecondsPerLiquidityX128 =
      observations[0].secondsPerLiquidityCumulativeX128 -
      observations[1].secondsPerLiquidityCumulativeX128
  
    const secondsBetween = observations[1].secondsAgo - observations[0].secondsAgo
    const secondsBetweenX128 = BigInt(secondsBetween) << BigInt(128)
  
    return secondsBetweenX128 / diffSecondsPerLiquidityX128
  }
}

// Developer's Note: Much of the code here was pulled from this reference: https://github.com/Uniswap/examples/blob/main/v3-sdk/oracle/src/libs/oracle.ts