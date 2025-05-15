import { Contract } from "ethers";
import { FeeAmount, Pool, tickToPrice } from "@uniswap/v3-sdk";
import { Price, Token } from '@uniswap/sdk-core'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { Observation, PoolMetadata, readProvider } from "../../utils/utils";
import { ORACLE_CONTRACT_ADDRESS } from "../../utils/config";


// Define observation metadata


export class UniswapOracle {
  public poolContract: Contract;
  public timeInterval: number;
  
  constructor(public asset: string, public metadata: PoolMetadata) {
    this.poolContract = new Contract(metadata.addr, IUniswapV3PoolABI.abi, readProvider);
    this.timeInterval = 108 // uniswap default of 108 second time interval
  }

  private async _observe(secondsAgo: number): Promise<Observation[]> {
    const timestamps = [0, secondsAgo]
  
    const [tickCumulatives, secondsPerLiquidityCumulatives] =
      await this.poolContract.observe(timestamps)
  
    const observations: Observation[] = timestamps.map((time, i) => {
      return {
        secondsAgo: time,
        tickCumulative: BigInt(tickCumulatives[i]),
        secondsPerLiquidityCumulativeX128: BigInt(
          secondsPerLiquidityCumulatives[i]
        ),
      }
    })
    return observations
  }

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

  public async getAverages(): Promise<{
    twap: Price<Token, Token>
    twal: bigint
  }> {
    const secondsAgo = this.timeInterval
    const observations: Observation[] = await this._observe(secondsAgo)
  
    const slot0 = await this.poolContract['slot0']()
    const liquidity = await this.poolContract['liquidity']()
    const pool = new Pool(
      this.metadata.token0,
      this.metadata.token1,
      FeeAmount.MEDIUM, // hard coding medium fee amount for standardization, but this can be changed
      slot0.sqrtPriceX96,
      liquidity,
      slot0.tick
    )
  
    const twap = this._calculateTWAP(observations, pool)
    const twal = this._calculateTWAL(observations)
  
    return { twap, twal }
  }

  //** @return returns the latest price in USDC decimal notation */
  public async getLatestPriceInUsd(): Promise<number> {
    return 0;
  }
}

// Developer's Note: Much of the code here was pulled from this reference: https://github.com/Uniswap/examples/blob/main/v3-sdk/oracle/src/libs/oracle.ts