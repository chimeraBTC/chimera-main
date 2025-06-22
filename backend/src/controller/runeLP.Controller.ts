import sdk, { type IConnection } from "@saturnbtcio/pools-api-sdk";
import * as bitcoin from "bitcoinjs-lib";
import axios from "axios";
import { Decimal } from "decimal.js";
import { postSaturnData } from "../utils/saturn.service";
import { type PoolStatsResponse } from "../types/type";
import {
  SATURN_KEY,
  SATURN_URL,
  POOL_ID,
  RUNE_TOKEN_NAME_1,
  RUNE_TOKEN_NAME_2,
  SATURN_CONNECT_URL,
} from "../config/config";

const connection: IConnection = {
  host: SATURN_CONNECT_URL, // Replace with your API base URL
  headers: {
    "x-api-key": SATURN_KEY as string,
  },
};

export const checkUserPosition = async (pubkey: string) => {
  try {
    const url = `${SATURN_URL}/v0/user/position/${pubkey}/${POOL_ID}`;
    await axios.get(url);
    return true;
  } catch (error) {
    console.log("Error occurs while check User Position", error);
    return false;
  }
};

export const getTokenPrice = async () => {
  try {
    const url = `${SATURN_URL}/v0/pool/by-id/${POOL_ID}`;
    const res = await axios.get(url);
    return res.data.price;
  } catch (error) {
    console.log("Get Token Price Error => ", error);
    return 0;
  }
};

export const getTokenSwapPrice = async (amount: number, feeRate: number) => {
  try {
    const url = `https://api-dev.saturnbtc.io/pool/swap/details?exactIn=true&feeRate=${feeRate}&zeroToOne=true&token0=${RUNE_TOKEN_NAME_1}&token1=${RUNE_TOKEN_NAME_2}&amount=${amount}`;
    const res = await axios.get(url);
    return res.data.price;
  } catch (error) {
    console.log("Get Token Price Error => ", error);
    return 0;
  }
};

export async function getPoolById(poolId: string): Promise<PoolStatsResponse> {
  const response = await fetch(
    `https://indexer-dev.saturnbtc.io/v0/pool/stats/by-ids?poolIds=${poolId}`,
    {
      headers: {
        accept: "*/*",
        "content-type": "application/json",
      },
      body: null,
      method: "GET",
    }
  );

  const poolStats = (await response.json()) as PoolStatsResponse[];
  if (poolStats.length !== 1) {
    throw new Error(`Pool with id ${poolId} not found`);
  }

  return poolStats[0];
}

function convertAmount0ToAmount1(amount0: string, price: string): string {
  const _amount0 = new Decimal(amount0);
  const _price = new Decimal(price);

  return _amount0.times(_price).toFixed(0);
}

function convertAmount1ToAmount0(amount1: string, price: string): string {
  const _amount1 = new Decimal(amount1);
  const _price = new Decimal(price);

  return _amount1.div(_price).toFixed(0);
}

export const getPoolKey = async (pubkey: string) => {
  try {
    const url = `${SATURN_URL}/v0/user/position/${pubkey}/${POOL_ID}`;
    const res = await axios.get(url);
    return res.data.owner;
  } catch (error) {
    console.log("Get User Pool Pubkey Error => ", error);
    return "";
  }
};

export const preDepositAssets = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount: number,
  type: boolean
) => {
  try {
    const checkPosition = await checkUserPosition(runePubkey);
    const poolData = await getPoolById(POOL_ID);
    console.log(poolData.price);
    let amount0;
    let amount1;
    if (type) {
      amount0 = amount.toString();
      amount1 = convertAmount0ToAmount1(amount0, poolData.price);
    } else {
      amount1 = amount.toString();
      amount0 = convertAmount1ToAmount0(amount1, poolData.price);
    }

    const psbtData = await prePosition(
      paymentAddress,
      paymentPubkey,
      runeAddress,
      runePubkey,
      feeRate,
      amount0,
      amount1,
      checkPosition
    );
    console.log(psbtData, amount0, amount1, checkPosition);
    return {
      psbtData,
      amount0: amount0,
      amount1: amount1,
      checkPosition,
    };
  } catch (error) {
    console.log("Error Occurs while Deposit Assets => ", error);
    throw error;
  }
};

const prePosition = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  checkPosition: boolean
) => {
  try {
    if (!checkPosition) {
      // const psbtResponse =
      //   await sdk.functional.v0.pool.open_position.psbt.openPositionPsbt(
      //     connection,
      //     {
      //       token0: RUNE_TOKEN_NAME_1,
      //       token1: RUNE_TOKEN_NAME_2,
      //       amount0,
      //       amount1,
      //       initializeAccountUtxo: true,
      //       feeRate,
      //       pubkey,
      //       address,
      //     }
      //   );
      // return psbtResponse.data;
      const psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/open-position/psbt`,
        {
          token0: RUNE_TOKEN_NAME_1,
          token1: RUNE_TOKEN_NAME_2,
          amount0,
          amount1,
          initializeAccountUtxo: true,
          feeRate,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
      return psbtResponse;
    } else {
      // const psbtResponse =
      //   await sdk.functional.v0.pool.increase_liquidity.psbt.increaseLiquidityPsbt(
      //     connection,
      //     {
      //       token0: RUNE_TOKEN_NAME_1,
      //       token1: RUNE_TOKEN_NAME_2,
      //       amount0,
      //       amount1,
      //       initializeAccountUtxo: false,
      //       feeRate,
      //       pubkey,
      //       address,
      //     }
      //   );
      // return psbtResponse.data;
      const psbtResponse: any =
        await sdk.functional.v0.pool.increase_liquidity.psbt.increaseLiquidityPsbt(
          connection,
          {
            runePubkey,
            runeAddress,
            paymentAddress,
            paymentPubkey,
            feeRate,
            amount0: amount0!,
            amount1: amount1!,
            token0: RUNE_TOKEN_NAME_1,
            token1: RUNE_TOKEN_NAME_2,
            initializeAccountUtxo: false,
          }
        );
      return psbtResponse.data.psbt;
    }
  } catch (error) {
    console.log("Error Occurs while Pre Open Position");
    throw error;
  }
};

export const generateMessage = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  signedPsbt: string,
  account: any,
  checkPosition: boolean
) => {
  try {
    const userPoolPubkey = await getPoolKey(runePubkey);
    const psbtBase64 = bitcoin.Psbt.fromHex(signedPsbt).toBase64();
    let messageHashResponse: any;
    if (!checkPosition) {
      // messageHashResponse =
      //   await sdk.functional.v0.pool.open_position.message.openPositionMessage(
      //     connection,
      //     {
      //       pubkey,
      //       poolId: POOL_ID,
      //       amount0: amount0,
      //       amount1: amount1,
      //       feeRate,
      //       signedPsbt: psbtBase64,
      //       account: account, // From PSBT response
      //       address,
      //     }
      //   );
      messageHashResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/open-position/message`,
        {
          poolId: POOL_ID,
          amount0,
          amount1,
          feeRate,
          signedPsbt: psbtBase64,
          account: account,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    } else {
      // messageHashResponse =
      //   await sdk.functional.v0.pool.increase_liquidity.message.increaseLiquidityMessage(
      //     connection,
      //     {
      //       positionPubKey: userPoolPubkey,
      //       pubkey,
      //       poolId: POOL_ID,
      //       amount0: amount0,
      //       amount1: amount1,
      //       feeRate,
      //       signedPsbt: psbtBase64,
      //       address,
      //     }
      //   );
      messageHashResponse =
        await sdk.functional.v0.pool.increase_liquidity.message.increaseLiquidityMessage(
          connection,
          {
            runeAddress,
            runePubkey,
            paymentPubkey,
            paymentAddress,
            signedPsbt: psbtBase64,
            feeRate,
            poolId: POOL_ID,
            positionPubKey: userPoolPubkey,
            amount0: amount0!,
            amount1: amount1!,
            mergeUtxoPsbt: psbtBase64,
          }
        );
    }
    console.log(
      messageHashResponse,
      psbtBase64,
      account,
      amount0,
      amount1,
      userPoolPubkey
    );
    return {
      message: messageHashResponse,
      psbtBase64,
      account,
      amount0,
      amount1,
      userPoolPubkey,
    };
  } catch (error) {
    console.log("Error while generate Open Message", error);
    throw error;
  }
};

export const submitSignedMessage = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  signedPsbt: string,
  account: any,
  signature: string,
  positionPubKey: string,
  checkPosition: boolean
) => {
  try {
    let positionResponse: any;
    if (!checkPosition) {
      // positionResponse =
      //   await sdk.functional.v0.pool.open_position.openPosition(connection, {
      //     pubkey,
      //     poolId: POOL_ID,
      //     amount0: amount0,
      //     amount1: amount1,
      //     feeRate,
      //     signedPsbt,
      //     account: account, // From PSBT response
      //     signature,
      //     address,
      //   });
      positionResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/open-position`,
        {
          signature,
          poolId: POOL_ID,
          amount0,
          amount1,
          feeRate,
          signedPsbt,
          account: account,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    } else {
      // positionResponse =
      //   await sdk.functional.v0.pool.increase_liquidity.increaseLiquidity(
      //     connection,
      //     {
      //       pubkey,
      //       poolId: POOL_ID,
      //       amount0: amount0,
      //       amount1: amount1,
      //       feeRate,
      //       signedPsbt,
      //       signature,
      //       positionPubKey,
      //       address,
      //     }
      //   );
      positionResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/increase-liquidity`,
        {
          signature,
          positionPubKey,
          poolId: POOL_ID,
          feeRate,
          signedPsbt,
          amount0,
          amount1,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    }
    console.log(positionResponse);
    return positionResponse;
  } catch (error) {
    console.log("Error while Submit Message", error);
    throw error;
  }
};

export const swapGeneratePsbt = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount: number,
  assetType: boolean
) => {
  try {
    const price = await getTokenSwapPrice(amount, feeRate);
    console.log(price);
    let amount0 = 0;
    let amount1 = 0;
    if (assetType) {
      amount0 = Number(amount);
      amount1 = Number(price) * Number(amount);
    } else {
      amount0 = Number(amount);
      amount1 = Number(amount) / Number(price);
    }
    // const psbtResponse: any = await sdk.functional.v0.pool.swap.psbt.swapPsbt(
    //   connection,
    //   {
    //     pubkey: pubkey,
    //     poolId: POOL_ID,
    //     amountIn: Math.trunc(amount0).toString(),
    //     amountOut: Math.trunc(amount1).toString(),
    //     feeRate: feeRate,
    //     zeroToOne: true,
    //     exactIn: true,
    //     address: address,
    //   }
    // );

    const psbtResponse = await postSaturnData(
      `${SATURN_CONNECT_URL}/v0/pool/swap/psbt`,
      {
        poolId: POOL_ID,
        amountIn: Math.trunc(amount0).toString(),
        amountOut: Math.trunc(amount1).toString(),
        feeRate,
        zeroToOne: assetType,
        exactIn: true,
        runePubkey,
        runeAddress,
        paymentAddress,
        paymentPubkey,
      }
    );

    console.log(
      psbtResponse,
      Math.trunc(amount0).toString(),
      Math.trunc(amount1).toString(),
      assetType
    );
  } catch (error) {
    console.log("Swap Generate Psbt error => ", error);
    throw error;
  }
};

export const swapMessage = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  signedPsbt: string,
  splitRunePsbt: string,
  shardPubkeys: string[],
  assetType: boolean
) => {
  try {
    const psbtBase64 = bitcoin.Psbt.fromHex(signedPsbt).toBase64();
    let splitRunePsbtBase64;
    let psbtResponse;
    if (splitRunePsbt !== "") {
      splitRunePsbtBase64 = bitcoin.Psbt.fromHex(splitRunePsbt).toBase64();
      psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/swap/message`,
        {
          signedPsbt: psbtBase64,
          splitRunePsbt: splitRunePsbtBase64,
          poolId: POOL_ID,
          amountIn: amount0,
          amountOut: amount1,
          feeRate,
          zeroToOne: assetType,
          exactIn: true,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    } else {
      psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/swap/message`,
        {
          signedPsbt: psbtBase64,
          poolId: POOL_ID,
          amountIn: amount0,
          amountOut: amount1,
          feeRate,
          zeroToOne: assetType,
          exactIn: true,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
          shardPubkeys,
        }
      );
    }

    console.log(
      psbtResponse,
      psbtBase64,
      splitRunePsbtBase64,
      amount0,
      amount1,
      assetType,
      shardPubkeys
    );
  } catch (error) {
    console.log("Swap Message error => ", error);
    throw error;
  }
};

export const submitSwap = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  signedPsbt: string,
  splitRunePsbt: string,
  signature: string,
  shardPubkeys: string[],
  assetType: boolean
) => {
  try {
    let psbtResponse;
    if (assetType)
      psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/swap`,
        {
          signedPsbt,
          splitRunePsbt,
          poolId: POOL_ID,
          amountIn: amount0,
          amountOut: amount1,
          feeRate,
          zeroToOne: assetType,
          exactIn: true,
          signature,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    else
      psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/swap`,
        {
          signedPsbt,
          poolId: POOL_ID,
          amountIn: amount0,
          amountOut: amount1,
          feeRate,
          zeroToOne: assetType,
          exactIn: true,
          signature,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
          shardPubkeys,
        }
      );

    console.log(psbtResponse);
  } catch (error) {
    console.log("Submit Swap error => ", error);
    throw error;
  }
};
