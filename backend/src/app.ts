/**
 * CHIMERA Backend Server
 * 
 * This is the main entry point for the CHIMERA backend API server.
 * It sets up the Express application, connects to MongoDB, configures middleware,
 * and defines the API routes for handling Rune/Inscription swaps and liquidity operations.
 * 
 * The server provides endpoints for:
 * - PSBT (Partially Signed Bitcoin Transaction) generation and processing
 * - Rune/Inscription atomic swaps
 * - Liquidity pool operations
 * - User management
 * - ETF (Exchange-Traded Fund) operations
 */

// Import required modules and dependencies
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
// import path from "path"; // Unused import
import http from "http";

// Import configuration and database connection
import { PORT } from "./config/config";
import { connectMongoDB } from "./config/db";

// Import route handlers
import { GeneratePSBTRoute, UserRoute, ETFRoute } from "./routes";

// Import controller functions for PSBT operations
import {
  sendInscription,
  preGenerateReconvertPSBT,
} from "./controller/generatePSBT.Controller";

// Import utility functions (commented out unused imports)
// import { getFeeRate } from "./utils/psbt.service";

/**
 * Initialize Application
 */

// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectMongoDB()
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Create an instance of the Express application
const app = express();

/**
 * Middleware Configuration
 */

// Set up Cross-Origin Resource Sharing (CORS) to allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Parse JSON and URL-encoded request bodies with increased size limit for PSBT data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Create HTTP server instance
const server = http.createServer(app);

/**
 * API Routes
 * 
 * All API endpoints are prefixed with /api
 * - /api/swap: Handles PSBT generation and swap operations
 * - /api/user: User-related endpoints
 * - /api/etf: ETF (Exchange-Traded Fund) operations
 */
app.use("/api/swap", GeneratePSBTRoute);
app.use("/api/user", UserRoute);
app.use("/api/etf", ETFRoute);

const test = async () => {
  // const feeRate = await getFeeRate(); // Unused for now
  // preGenerateRuneSwap(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   100
  // );
  // pushSwapPsbt(
  //   [
  //     "70736274ff0100fdba010200000002c5fb32b8ba367d519c5bcec010245ba958d89eb93dc18f958b19d0f678f439300200000000ffffffff306ae5df7f36d031de2448dbd34ae1ac368adf4a60b4df4946bad55faaad046d0400000000ffffffff080000000000000000286a5d2500dbb804ba081e030000a2843d0406e80764010000d491ebdc0302000114050000ac843d06220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd97102202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f2202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd97102202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd9710b443070000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b2202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113411ec56d6bd484b7f1fcfa2d8040afb578c5bb06c5a094e1125311a3751b92f0668b14a9a4e911acf8beb6a3f8253dcb46913ff57cc87ca60e4e48b9f4bcad6dc9810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f58230001012b20a1070000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f0103048100000001134192aafcd9f4bb3b22f47d75d9a291532b943d514476c4429b847f45a13995ad17c945a4dfe13589430fdc4fbe10604d735652bc107c61eb5062b44c2b4f5d8f44810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823000000000000000000",
  //     "70736274ff0100fd8e010200000001306ae5df7f36d031de2448dbd34ae1ac368adf4a60b4df4946bad55faaad046d0500000000ffffffff080000000000000000256a5d2200e1b804eb0707050000b9843d0600010a030000b6843d0400030f010000b1843d022202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd97102202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd97102202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd9710c658070000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b20a1070000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113413171527004d9a247ffe414656d834c8bbc60079c073fdae87f848545cf451f97a868c167a19da1b354adf0fae6eec44f9bc14debc7242cd4135fbde4fd14b080810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823000000000000000000",
  //     "70736274ff0100fd8e010200000001306ae5df7f36d031de2448dbd34ae1ac368adf4a60b4df4946bad55faaad046d0600000000ffffffff080000000000000000256a5d2200e1b804ea0705010000bb843d02000303050000bd843d06000304030000bc843d042202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd97102202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd97102202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd9710c658070000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b20a1070000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113411537efd03a0d0fb86e1fbf0df1e332088c19e2006cb22e0c6b5c35287bb455b2420e8a1a050f0f754e29da3554ccde5ee58ec3217a1e20bbdeb6e0132d9fe96c810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823000000000000000000",
  //     "70736274ff0100fd2f010200000001306ae5df7f36d031de2448dbd34ae1ac368adf4a60b4df4946bad55faaad046d0700000000ffffffff0600000000000000001c6a5d1900f59504d70403030000f11c04ec22ee0703010000bd843d022202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd97102202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f220200000000000022512038cee5a752704c4c2fbccde11010712620115ffcad225cdd645e253470cd9710ce65070000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b20a1070000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113413082434af33d007f5883e203396f3418c193dafe97798642a78ea88906e86d7dd827dc56b73fbf515e6d0fa42735fc01a75ce223740382523303e2c1bf982d28810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f582300000000000000",
  //   ],
  //   [
  //     [
  //       "24b9d0e8f2f328b3d36b5088dc747a5c761b5980b3ebdb403e30dc67462ecff4",
  //       "cd09ea782c5c5e2f23d9decf7dfe51e26aafa3d4d2100da240969d1908d1942d",
  //     ],
  //     [
  //       "df421377d43eaa5c4958ac836f461dad0e9a7a0b00c4a2267abc60afcb84eeb3",
  //       "8e8ca19ae271739772105774c5c411446457f25bce59c7c42cd88f21051f2529",
  //       "c870ba2d7bea3a17033f22f549bd6bb1a3bb584acef246d53124c9ef69a66a63",
  //     ],
  //     [
  //       "b4d98ca59bd4deaac639e73b5428649807fa077a0bc6a26225ef9539a5f8eb3a",
  //       "cc00692f826d3c8e9a690c5b874c9aee1622f1df9166be12841fab1b92e68f4c",
  //       "6799e247a34a83b7f4bfe48c7334af3c00cef3abbf797177b1d476e25f50a678",
  //     ],
  //     [
  //       "5b47a6b32e450f13c1bed848a83fb85a2673a1dbcb96a3f7decb42d0ccbf353f",
  //       "c2abeb68fb60e249f01bf1504fbcdf92c257b0c75245a550756ee373c26c641c",
  //     ],
  //   ],
  //   [
  //     [3, 3],
  //     [2, 2, 2],
  //     [3, 3, 3],
  //     [1, 1],
  //   ]
  // );
  // preGenerateSendRuneToSWAP(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109"
  // );
  /**
   * Open Position
   */

  // await preDepositAssets(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   100,
  //   true
  // );
  // generateMessage(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   "100",
  //   "130190",
  //   "70736274ff0100fd1b010200000002554bfc86be88dc59a4ef9ee6f66f5ba45e2633dbea2ebaf75b48ee5d4076a0e10000000000ffffffff554bfc86be88dc59a4ef9ee6f66f5ba45e2633dbea2ebaf75b48ee5d4076a0e10300000000ffffffff052202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f22020000000000002251202dc5e99ddad5c4824e84ee53c9ef5dbab00330ed491887ed6ad3a0c8d688ae29d1040200000000002251202dc5e99ddad5c4824e84ee53c9ef5dbab00330ed491887ed6ad3a0c8d688ae2900000000000000000a6a5d07009e9e030e640190cb8a0b00000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b2202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f01030401000000011341f73a241ca11034452e52d87b0b7c28198d69abb8f3cdb78519549560d9554d4e8f92510f4fedcc4607b468a1911df84d55f7801bcdcff7d084b2e37665998a3b010117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f58230001012b3dd68c0b00000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f01030401000000011341be37430d33f2aad858ca9f8c0114ac3b96403abf00f8287eebeea0f8a21dd182aa51d0747d333b88b4b218ff246d53457f09c1efa5a0b8dc6bd798a6f6870570010117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823000000000000",
  //   {
  //     privkey:
  //       "8e1c33170fd915f39da1e75722a0225db89cd6a3479ae0202b7967f770b44282",
  //     pubkey:
  //       "d076acdf6a9d25f6c5ab7f59ea1af150ecb1c955fdc942721f3eac65dc167641",
  //     address: "tb1pdhsmauzs46s9qs0mj3ucl5gp8v5zfvpfx5zxlpyfjp4anws3za4sew0ynu",
  //   },
  //   false
  // );
  // submitSignedMessage(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   "100",
  //   "339521",
  //   "cHNidP8BAP1GAQIAAAACY0Z7WJ05fUDopU7ViJt+7HoECjof0WfvOaE3v44JdqcAAAAAAP////8hG0onfeknhquISm993chn8PK2WAXVp+ae5cZSFrjWXQEAAAAA/////wYiAgAAAAAAACJRIEN7S17uB/HpbaKdQ/x2Ie136SInFiAZP3vhLHvOVAhvIgIAAAAAAAAiUSAtxemd2tXEgk6E7lPJ7126sAMw7UkYh+1q06DI1oiuKYQ2BQAAAAAAIlEgLcXpndrVxIJOhO5Tye9durADMO1JGIftatOgyNaIrikiAgAAAAAAACJRIG3hvvBQrqBQQfuUeY/RATsoJLApNQRvhImQa9m6ERdrAAAAAAAAAAAKal0HAJ6eAw5kAdBjlwsAAAAAIlEgQ3tLXu4H8eltop1D/HYh7XfpIicWIBk/e+Ese85UCG8AAAAAAAEBKyICAAAAAAAAIlEgQ3tLXu4H8eltop1D/HYh7XfpIicWIBk/e+Ese85UCG8BAwQBAAAAARNB/H5hWSRk32JM61iPeGj5C9pvTBOfIZ09kCh+FeRy4ZzGRrpgD8nzwawF4RweS4ypq2rv4fZrClVN+sKo/i/OFQEBFyBicv5M93RsnD3j1Ir8Xyf+S6BS/I9ykTpgIPqXD39YIwABASvTopwLAAAAACJRIEN7S17uB/HpbaKdQ/x2Ie136SInFiAZP3vhLHvOVAhvAQMEAQAAAAETQZi0lGEmvNuaRy9HycbWZiaFHgAH0JYJtCH53nrwrjlJyvacvRnx2AcOM7gYvhhkMz36JFJfBBaShIEXIXWPG70BARcgYnL+TPd0bJw949SK/F8n/kugUvyPcpE6YCD6lw9/WCMAAAAAAAAA",
  //   {
  //     privkey:
  //       "8e1c33170fd915f39da1e75722a0225db89cd6a3479ae0202b7967f770b44282",
  //     pubkey:
  //       "d076acdf6a9d25f6c5ab7f59ea1af150ecb1c955fdc942721f3eac65dc167641",
  //     address: "tb1pdhsmauzs46s9qs0mj3ucl5gp8v5zfvpfx5zxlpyfjp4anws3za4sew0ynu",
  //   },
  //   "AUD7BYizyEWI37r67u6D9/8Rys916+QOpD2CuqQ9W5JaZrfutKOpCv2fMn/8Nb2Fm5+PEQ5eFPe195ZDIDromktX",
  //   "",
  //   false
  // );

  /**
   * Inscrease Liquidity
   */

  // await preDepositAssets(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   100,
  //   true
  // );
  // generateMessage(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   "100",
  //   "337678",
  //   "70736274ff0100fd1b01020000000248dfa50daeaabd3e72dacf20c05ac47edf42ec5a51d234e8b195b48509299d6b0000000000ffffffff0f09413815315acc6aceca53fd2986281f72614c59ec7babd0a381cbcc0cbbfb0100000000ffffffff052202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f22020000000000002251202dc5e99ddad5c4824e84ee53c9ef5dbab00330ed491887ed6ad3a0c8d688ae29d3340500000000002251202dc5e99ddad5c4824e84ee53c9ef5dbab00330ed491887ed6ad3a0c8d688ae2900000000000000000a6a5d07009e9e030e6401d748db0700000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b2202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f01030401000000011341dfad9e16f14dbb03348aa1f1a557663ac77e3436a9d874cb6c78a71e17ad1f9481f9251dad74bd5e984373b94ebbf0ac6939125539b33872aeb04a8d89505350010117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f58230001012b0286e00700000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304010000000113415ab2b1a7e3fbd95c5c4eef43f1a586089fa6654f22dd800ae74cb564a03388000faf759e806391b87bcb2beae6cd0e9db9c70c98f68b7290efad252c071d14ba010117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823000000000000",
  //   {
  //     privkey:
  //       "8e1c33170fd915f39da1e75722a0225db89cd6a3479ae0202b7967f770b44282",
  //     pubkey:
  //       "d076acdf6a9d25f6c5ab7f59ea1af150ecb1c955fdc942721f3eac65dc167641",
  //     address: "tb1pdhsmauzs46s9qs0mj3ucl5gp8v5zfvpfx5zxlpyfjp4anws3za4sew0ynu",
  //   },
  //   true
  // );1202111111111111111111111111111111111111111111113.
  // submitSignedMessage(
  //   "tb1pg33da5khhwqlc7jmdzn4plca3pa4m7jg38zcspj0mmuyk8hnj5pphskers72",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   "100",
  //   "331032",
  //   "cHNidP8BAP0bAQIAAAACSN+lDa6qvT5y2s8gwFrEft9C7FpR0jTosZW0hQkpnWsAAAAAAP////+kFs5OdgRfkWrDTaz6FlZP1QSfApeWo6lenwm+GmKHLwEAAAAA/////wUiAgAAAAAAACJRIEN7S17uB/HpbaKdQ/x2Ie136SInFiAZP3vhLHvOVAhvIgIAAAAAAAAiUSAtxemd2tXEgk6E7lPJ7126sAMw7UkYh+1q06DI1oiuKZ4dBQAAAAAAIlEgLcXpndrVxIJOhO5Tye9durADMO1JGIftatOgyNaIrikAAAAAAAAAAApqXQcAnp4DDmQBc7/lCgAAAAAiUSBDe0te7gfx6W2inUP8diHtd+kiJxYgGT974Sx7zlQIbwAAAAAAAQErIgIAAAAAAAAiUSBDe0te7gfx6W2inUP8diHtd+kiJxYgGT974Sx7zlQIbwEDBAEAAAABE0HJj3hpd3GQs/Ium6+br+hJ5Uwz28QdCowSq0O+PC4qKwZnXIqtJzKf4217zydWgZvkpjs7B/N/2KSq15p8zMSbAQEXIGJy/kz3dGycPePUivxfJ/5LoFL8j3KROmAg+pcPf1gjAAEBK6fm6goAAAAAIlEgQ3tLXu4H8eltop1D/HYh7XfpIicWIBk/e+Ese85UCG8BAwQBAAAAARNBFJ7gLzovvrtERrkS+rPhmNrffZcnJiF0OyX+Gfmvq75RrRg3+8cUxR5wZwqd+CYQAJb2hGur1zfdSdfejD9/VwEBFyBicv5M93RsnD3j1Ir8Xyf+S6BS/I9ykTpgIPqXD39YIwAAAAAAAA==",
  //   {
  //     privkey:
  //       "8e1c33170fd915f39da1e75722a0225db89cd6a3479ae0202b7967f770b44282",
  //     pubkey:
  //       "d076acdf6a9d25f6c5ab7f59ea1af150ecb1c955fdc942721f3eac65dc167641",
  //     address: "tb1pdhsmauzs46s9qs0mj3ucl5gp8v5zfvpfx5zxlpyfjp4anws3za4sew0ynu",
  //   },
  //   "AUCL/CAmL4GtDsT8No8bDxYn6pbyjWbXXfrZVvkcrl9/2qqD0afio7c/1Yqb9721+cS90FdhKFemDCd4eryq2+Nz",
  //   "6272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823",
  //   true
  // );

  /**
   * Swap
   */
  // swapGeneratePsbt(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   10000,
  //   false
  // );
  // swapMessage(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   "10000",
  //   "8",
  //   "70736274ff0100fd1f01020000000148dfa50daeaabd3e72dacf20c05ac47edf42ec5a51d234e8b195b48509299d6b0400000000ffffffff0622020000000000002251207f4151142f36d78e26272f55153d4a34f2e2329f0fd6160a9731160123edfa2622020000000000002251202dc5e99ddad5c4824e84ee53c9ef5dbab00330ed491887ed6ad3a0c8d688ae292202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086fc3280000000000002251202dc5e99ddad5c4824e84ee53c9ef5dbab00330ed491887ed6ad3a0c8d688ae2900000000000000000c6a5d091601009e9e030e0802eeb5ea0a00000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b33eaea0a00000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113411dddb54c412ec379e52fb5bdc928950f1b1d5fa923ec3bee29153efcbfcc98eed7c258365ffb32ee545aa1a41e3576005d024a93d185503fdf770c08a06404bb810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f582300000000000000",
  //   "",
  //   ["edc85e70c7f06a3b38bac24803d4eadb4439e165918e4df4745e69c7f9aed017"],
  //   false
  // );
  // submitSwap(
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  //   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
  //   feeRate,
  //   "10000",
  //   "8",
  //   "cHNidP8BAP0fAQIAAAABSN+lDa6qvT5y2s8gwFrEft9C7FpR0jTosZW0hQkpnWsEAAAAAP////8GIgIAAAAAAAAiUSB/QVEULzbXjiYnL1UVPUo08uIynw/WFgqXMRYBI+36JiICAAAAAAAAIlEgLcXpndrVxIJOhO5Tye9durADMO1JGIftatOgyNaIrikiAgAAAAAAACJRIEN7S17uB/HpbaKdQ/x2Ie136SInFiAZP3vhLHvOVAhvwygAAAAAAAAiUSAtxemd2tXEgk6E7lPJ7126sAMw7UkYh+1q06DI1oiuKQAAAAAAAAAADGpdCRYBAJ6eAw4IAu616goAAAAAIlEgQ3tLXu4H8eltop1D/HYh7XfpIicWIBk/e+Ese85UCG8AAAAAAAEBKzPq6goAAAAAIlEgQ3tLXu4H8eltop1D/HYh7XfpIicWIBk/e+Ese85UCG8BAwSBAAAAARNBHd21TEEuw3nlL7W9ySiVDxsdX6kj7DvuKRU+/L/MmO7Xwlg2X/sy7lRaoaQeNXYAXQJKk9GFUD/fdwwIoGQEu4EBFyBicv5M93RsnD3j1Ir8Xyf+S6BS/I9ykTpgIPqXD39YIwAAAAAAAAA=",
  //   "",
  //   "AUBPLO0Qy7ED+Nipy5GGkSJCRL/FKqbGAOotCNF2E0f9Mb8eQMKOFnS1yuYZF7KKJVSxA77n2lSsB4tPQFaT87Yc",
  //   ["edc85e70c7f06a3b38bac24803d4eadb4439e165918e4df4745e69c7f9aed017"],
  //   false
  // );
};

test();

// Initialize MVP hybrid swap maker orders: 10 rune orders + 5 inscription orders
const initializeEscrow = async () => {
  console.log("🚀 Initializing MVP hybrid swap maker orders...");
  console.log("Target: 10 rune orders (100k each) + 5 inscription orders");
  
  try {
    // Import required modules
    const { fetchAvailableInscriptionUTXO } = await import("./utils/utxo.service.js");
    const { WalletTypes } = await import("./config/config.js");
    
    console.log("📝 Step 1: Generating 10 rune maker orders (100k runes each)...");
    
    // Generate 10 rune maker orders
    for (let i = 0; i < 10; i++) {
      await sendInscription("035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109");
      console.log(`✅ Rune maker order ${i + 1}/10 generated`);
    }
    
    console.log("📝 Step 2: Fetching available inscriptions from escrow...");
    
    // Get inscriptions from escrow
    const escrowInscriptions = await fetchAvailableInscriptionUTXO(
      "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy"
    );
    
    console.log(`Found ${escrowInscriptions.length} inscriptions in escrow`);
    
    console.log("📝 Step 3: Generating 5 inscription maker orders...");
    
    // Generate 5 inscription maker orders
    const maxInscriptionOrders = Math.min(5, escrowInscriptions.length);
    for (let i = 0; i < maxInscriptionOrders; i++) {
      await preGenerateReconvertPSBT(
        WalletTypes.UNISAT,
        "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
        "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
        "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
        "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
        escrowInscriptions[i].inscriptionId
      );
      console.log(`✅ Inscription maker order ${i + 1}/${maxInscriptionOrders} generated (${escrowInscriptions[i].inscriptionId})`);
    }
    
    console.log("🎉 MVP hybrid swap initialization completed successfully!");
    console.log(`📊 Summary: ${10} rune orders + ${maxInscriptionOrders} inscription orders ready`);
    
  } catch (error: any) {
    console.error("❌ Error initializing MVP hybrid swap:", error);
    console.error(error.stack);
  }
};

// Run escrow initialization 
initializeEscrow();
// preGeneratePSBT(
//   0,
//   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
//   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
//   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
//   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109"
// );
// preGeneratePSBT(
//   1,
//   "tb1qcmau96c98ccp378zpfh3j93fgge59veefnvsgv",
//   "03ca5b7445f0becb4fee3fdbff62cd66050ffd396dec82eb9ca4802ab93ad9a7f3",
//   "tb1pfkryxz5cyx80w8ncs9wdg4zyh75sz9368pwt89rwv2e9zjelutpskxjgx8",
//   "ec653af44f32b248a7e1345b7fe9d257f0b384742e472dcd01d81383b5e2f251"
// );
// pushPSBT(
//   0,
//   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
//   "70736274ff0100fd22010200000002142dfb762f6b45e831c9d960c6d3c0c7daec12a6cd4e75e4efd6dc26a0a865e80200000000ffffffff713992949bd52bb6b0b8924173c981fa593b3963bbe788e2926e7620056892490100000000ffffffff052202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f0000000000000000116a5d0e00f59504d704a08d06020000000322020000000000002251203636642bcc9299b131f4cf9e0eb59ab66bd8e495add1c4fcc858592e774590a42202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086fbf4a050000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b2202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113417cd700e035d5a4d29b87a30007ca11aad1511f663ae4e82e2836eb14f4859cbd9188e268043c654dca5c7f04a7f01434f855e2c1d11cc31eb8d384968211874e810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f58230001012b4f54050000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113413835bb0bc42d7d68ee82513a3f99c18e7624e67a398735f5cb9527713914811c367a1dc6df1cf583fc5a37892aeec5de7115dc69248552ebfb9dc5daf7858da5810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823000000000000",
//   {
//     txid: "f8854d7208d75f08e2f78261b7eadb5671feeece8ecf9a2b37776740fc7854d2",
//     vout: 0,
//     value: 546,
//   }
// );
// preGenerateReconvertPSBT(
//   0,
//   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
//   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
//   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
//   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109",
//   "de1d935bd2f69aba5917a98889097caaf5110e3ad45c3902883e34a368847a3ai0"
// );
// preGenerateReconvertPSBT(
//   1,
//   "tb1qcmau96c98ccp378zpfh3j93fgge59veefnvsgv",
//   "03ca5b7445f0becb4fee3fdbff62cd66050ffd396dec82eb9ca4802ab93ad9a7f3",
//   "tb1pfkryxz5cyx80w8ncs9wdg4zyh75sz9368pwt89rwv2e9zjelutpskxjgx8",
//   "ec653af44f32b248a7e1345b7fe9d257f0b384742e472dcd01d81383b5e2f251",
//   "49d61c8965e02ebc293a270960da924fda6a48453cbb5902ea045567f6b02700i0"
// );

// pushReconvertPSBT(
//   0,
//   "70736274ff0100fd240102000000029da84fa933fa26a852af65c38fc0674c5646e625a7ad3aa184bf899dbb30d44c0000000000ffffffff69f46702748eca97de5304ce1f8a48192601de1f2b15abd080727260e55352f20100000000ffffffff0522020000000000002251203636642bcc9299b131f4cf9e0eb59ab66bd8e495add1c4fcc858592e774590a40000000000000000136a5d1000f59504d704a08d06020000c0843d032202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f22020000000000002251203636642bcc9299b131f4cf9e0eb59ab66bd8e495add1c4fcc858592e774590a4e64c050000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b2202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113415c9dd4c6a04855ef8267f6d2b50361ac651438abb62b0200247fe59a9260b3a75448ea96af6c40165067d7f6af920c8e630acee640bcda9b9f2dfc4aa8091004810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f58230001012b5454050000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f010304810000000113414e543e9dcc3dc468d8e0eeb75f4a83ff7809522bbf570e54943792d823e71c4507d50f27b86bb13b1c933e4f5d708a8bd674c1248cb4def188fd35ba65b7634c810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823000000000000",
//   [
//     {
//       txid: "a1842d3912a5e3de62eceba865e3822de3bba54bf0960442e95b02327a392fb7",
//       vout: 547,
//       amount: 1000000,
//       value: 546,
//     },
//   ]
// );

// preGenerateClaimPSBT(
//   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
//   "035eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109"
// );

// pushPSBT(
//   "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
//   "70736274ff010089020000000142af09065fe005100a989c25e89713b09ee16ea83b6defd8b6f37bf7a7a89f490100000000ffffffff022202000000000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086fa7a39c0b00000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f000000000001012b4ca79c0b00000000225120437b4b5eee07f1e96da29d43fc7621ed77e922271620193f7be12c7bce54086f01030481000000011341c302b69a6c783a12cf5c4cc1142c457f0acc2299b6f87276a0a192df7775847bc658232ef4d52f0408910c6b7b65b1994d2d8d5e581a6ad40644e02d6bfca9dc810117206272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823000000",
//   {
//     txid: "8e946f548092b031f95d6e2acff8c7fe64488eae9e5b52f14d612226feb89914",
//     vout: 256,
//     value: 546,
//   },
//   true
// );

// const test = async () => {
//   const result = await isUTXOSpent(
//     "c8bd23136a40bfdd0c0c7c95d7a2fb200ac41b25588fbf7174defc6314e32e89",
//     2
//   );
//   console.log(result);
// };

// test();

/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify that the server is running
 */
app.get("/", async (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "success",
    message: "CHIMERA Backend Server is Running",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

/**
 * Start the server
 */
const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('Unhandled Rejection! Shutting down...');
      console.error(err.name, err.message);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception! Shutting down...');
  console.error(err.name, err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM signal (e.g., from Docker)
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
