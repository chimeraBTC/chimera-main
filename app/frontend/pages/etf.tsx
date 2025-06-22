import { Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import Image from "next/image";
import {
  request,
  AddressPurpose,
  RpcErrorCode,
  signMultipleTransactions,
  BitcoinNetworkType,
  SignPsbtParams,
} from "sats-connect";
import Link from "next/link";
import WavyBackground from "@/components/WavyBackground";
import Footer from "@/components/Footer";
import { FaTwitter, FaDiscord, FaArrowDown, FaArrowUp } from "react-icons/fa";
import { useState, useEffect } from "react";
import Header from "@/components/header";
import Banner from "@/components/Banner";

const inter = Inter({ subsets: ["latin"] });

// Update the gradient animation constant
const gradientAnimation = {
  backgroundSize: "200% 200%",
  animation: "gradient 4s linear infinite",
};

// ETF Assets data
const etfAssets = [
  { 
    name: "DOG", 
    currentWeight: "25.4%", 
    targetWeight: "25%", 
    price: "$0.00000142", 
    change24h: "+5.2%", 
    marketCap: "$142M", 
    balance: "17,887,324,155" 
  },
  { 
    name: "ORDI", 
    currentWeight: "18.7%", 
    targetWeight: "20%", 
    price: "$42.87", 
    change24h: "-2.1%", 
    marketCap: "$901M", 
    balance: "4,361" 
  },
  { 
    name: "SATS", 
    currentWeight: "12.3%", 
    targetWeight: "12%", 
    price: "$0.0324", 
    change24h: "+1.7%", 
    marketCap: "$324M", 
    balance: "3,796,296" 
  },
  { 
    name: "QUANTUM CATS", 
    currentWeight: "10.5%", 
    targetWeight: "10%", 
    price: "$0.00214", 
    change24h: "+8.3%", 
    marketCap: "$214M", 
    balance: "4,906,542" 
  },
  { 
    name: "NODEMONKE", 
    currentWeight: "8.2%", 
    targetWeight: "8%", 
    price: "$0.00098", 
    change24h: "+3.4%", 
    marketCap: "$98M", 
    balance: "8,367,347" 
  },
  { 
    name: "OMB", 
    currentWeight: "7.6%", 
    targetWeight: "8%", 
    price: "$0.00076", 
    change24h: "-1.2%", 
    marketCap: "$76M", 
    balance: "10,000,000" 
  },
  { 
    name: "BTC PUPS", 
    currentWeight: "6.8%", 
    targetWeight: "7%", 
    price: "$0.00068", 
    change24h: "+12.4%", 
    marketCap: "$68M", 
    balance: "10,000,000" 
  },
  { 
    name: "MIM", 
    currentWeight: "4.2%", 
    targetWeight: "4%", 
    price: "$0.00042", 
    change24h: "-0.8%", 
    marketCap: "$42M", 
    balance: "10,000,000" 
  },
  { 
    name: "RSIC", 
    currentWeight: "3.5%", 
    targetWeight: "3%", 
    price: "$0.00035", 
    change24h: "+2.1%", 
    marketCap: "$35M", 
    balance: "10,000,000" 
  },
  { 
    name: "PUPS", 
    currentWeight: "2.8%", 
    targetWeight: "3%", 
    price: "$0.00028", 
    change24h: "+15.7%", 
    marketCap: "$28M", 
    balance: "10,000,000" 
  }
];

export default function ETFPage() {
  // const backendUrl = "https://api.chimera.finance/api";
  const backendUrl = "http://localhost:8001/api";

  // ETF specific states
  const [mode, setMode] = useState<"swap" | "redeem">("swap");
  const [isSwapFlipped, setIsSwapFlipped] = useState(false);
  const [sendAmount, setSendAmount] = useState<string>("1");
  const [getAmount, setGetAmount] = useState<string>("100");
  const [sendToken, setSendToken] = useState<string>("tBTC");
  const [getToken, setGetToken] = useState<string>("BTC TEN ETF TOKEN");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState<string>("$1,245.67");
  
  // ETF metrics
  const [tvl, setTvl] = useState<string>("$2.45M");
  const [aum, setAum] = useState<string>("$1.24B");
  const [volume, setVolume] = useState<string>("$345K");
  const [tokenPrice, setTokenPrice] = useState<string>("$1.24");
  const [priceChange, setPriceChange] = useState<string>("+5.2%");
  
  // Wallet states
  const [loading, setLoading] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState("");
  const [paymentPubkey, setPaymentPubkey] = useState("");
  const [ordinalAddress, setOrdinalAddress] = useState("");
  const [ordinalPubkey, setOrdinalPubkey] = useState("");
  const [walletType, setWalletType] = useState("");
  const [tbtcBalance, setTbtcBalance] = useState<number>(0);
  const [etfBalance, setEtfBalance] = useState<number>(0);

  // Fetch user balances and ETF data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for now - would be replaced with actual API calls
      setTimeout(() => {
        setTbtcBalance(0.025);
        setEtfBalance(100);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if wallet is connected from localStorage
    const storedPaymentAddress = localStorage.getItem("paymentAddress");
    const storedPaymentPubkey = localStorage.getItem("paymentPubkey");
    const storedOrdinalAddress = localStorage.getItem("ordinalAddress");
    const storedOrdinalPubkey = localStorage.getItem("ordinalPubkey");
    const storedWalletType = localStorage.getItem("walletType");

    if (
      storedPaymentAddress &&
      storedPaymentPubkey &&
      storedOrdinalAddress &&
      storedOrdinalPubkey &&
      storedWalletType
    ) {
      setPaymentAddress(storedPaymentAddress);
      setPaymentPubkey(storedPaymentPubkey);
      setOrdinalAddress(storedOrdinalAddress);
      setOrdinalPubkey(storedOrdinalPubkey);
      setWalletType(storedWalletType);
      fetchData();
    }
  }, []);

  const selectWalletConnect = async (walletType: number) => {
    try {
      const getAddressOptions = {
        payload: {
          purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
          message: "CHIMERA PROTOCOL needs your addresses",
          network: {
            type: BitcoinNetworkType.Testnet,
          },
        },
        onFinish: (response: any) => {
          const paymentAddress = response.addresses[0].address;
          const paymentPubkey = response.addresses[0].publicKey;
          const ordinalAddress = response.addresses[1].address;
          const ordinalPubkey = response.addresses[1].publicKey;

          setPaymentAddress(paymentAddress);
          setPaymentPubkey(paymentPubkey);
          setOrdinalAddress(ordinalAddress);
          setOrdinalPubkey(ordinalPubkey);

          if (walletType === 1) {
            setWalletType("Unisat");
            localStorage.setItem("walletType", "Unisat");
          } else if (walletType === 2) {
            setWalletType("Xverse");
            localStorage.setItem("walletType", "Xverse");
          } else if (walletType === 3) {
            setWalletType("Leather");
            localStorage.setItem("walletType", "Leather");
          }

          localStorage.setItem("paymentAddress", paymentAddress);
          localStorage.setItem("paymentPubkey", paymentPubkey);
          localStorage.setItem("ordinalAddress", ordinalAddress);
          localStorage.setItem("ordinalPubkey", ordinalPubkey);

          fetchData();
        },
        onCancel: () => {
          alert("Request canceled");
        },
      };

      if (walletType === 1) {
        await (window as any).unisat.requestAccounts();
        const accounts = await (window as any).unisat.getAccounts();
        setPaymentAddress(accounts[0]);
        setOrdinalAddress(accounts[0]);
        setWalletType("Unisat");
        localStorage.setItem("walletType", "Unisat");
        localStorage.setItem("paymentAddress", accounts[0]);
        localStorage.setItem("ordinalAddress", accounts[0]);
        fetchData();
      } else if (walletType === 2) {
        await request("getAddress" as any, getAddressOptions);
      } else if (walletType === 3) {
        await request("getAddress" as any, getAddressOptions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window !== "undefined") {
        if (
          typeof (window as any).unisat !== "undefined" ||
          typeof (window as any).LeatherProvider !== "undefined" ||
          typeof (window as any).BitcoinProvider !== "undefined"
        ) {
          // Wallet selection logic
        } else {
          alert("Please install Unisat, Xverse, or Leather wallet");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetMaxSend = () => {
    if (mode === "swap") {
      setSendAmount(tbtcBalance.toString());
    } else {
      setSendAmount(etfBalance.toString());
    }
  };

  const handleSetHalfSend = () => {
    if (mode === "swap") {
      setSendAmount((tbtcBalance / 2).toString());
    } else {
      setSendAmount((etfBalance / 2).toString());
    }
  };

  const handleSwapTokens = () => {
    if (mode === "swap") {
      // Toggle the swap direction
      setIsSwapFlipped(!isSwapFlipped);
      
      // Swap the amounts
      const tempAmount = sendAmount;
      setSendAmount(getAmount);
      setGetAmount(tempAmount);
    }
  };

  const handleProcessTransaction = async () => {
    try {
      setIsProcessing(true);
      
      // Mock successful transaction
      setTimeout(() => {
        setIsProcessing(false);
        setShowSuccess(true);
        
        // Reset form
        setTimeout(() => {
          setShowSuccess(false);
          setSendAmount("1");
          setGetAmount("100");
          fetchData();
        }, 3000);
      }, 2000);
    } catch (error) {
      console.error("Error processing transaction:", error);
      setIsProcessing(false);
    }
  };

  // Calculate estimated value for redeem mode
  useEffect(() => {
    if (mode === "redeem" && sendAmount) {
      const amount = parseFloat(sendAmount) || 0;
      const tokenValue = parseFloat(tokenPrice.replace("$", "")) || 0;
      const estimatedUsd = (amount * tokenValue).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setEstimatedValue(estimatedUsd);
    }
  }, [mode, sendAmount, tokenPrice]);

  return (
    <div className="overflow-hidden">
      <Banner />
      <main
        className={`flex min-h-screen flex-col items-center ${inter.className} overflow-x-hidden overflow-y-auto`}
      >
        <Head>
          <title>CHIMERA PROTOCOL - BTC10 ETF</title>
          <link rel="icon" href="/chimera-icon.svg" />
        </Head>

        {/* Content Container with Vignette */}
        <div className="relative w-full min-h-screen flex flex-col">
          {/* Fixed Wavy Background that stays throughout the page */}
          <div className="fixed inset-0 w-full h-full">
            <WavyBackground className="w-full h-full" />
            <div className="absolute inset-0 bg-black opacity-50" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col">
            <Header
              connectWallet={connectWallet}
              selectWalletConnect={selectWalletConnect}
              paymentAddress={paymentAddress}
              setPaymentAddress={setPaymentAddress}
              ordinalAddress={ordinalAddress}
              setOrdinalAddress={setOrdinalAddress}
              paymentPubkey={paymentPubkey}
              setPaymentPubkey={setPaymentPubkey}
              ordinalPubkey={ordinalPubkey}
              setOrdinalPubkey={setOrdinalPubkey}
              walletType={walletType}
              setWalletType={setWalletType}
              openWalletModal={false}
              setOpenWalletModal={() => {}}
            />

            {/* ETF Content */}
            <div className="flex-1 flex items-start justify-center px-4 py-8 mt-16">
              <div className="w-full max-w-[1280px] flex flex-col md:flex-row gap-6 pb-8">
                
                {/* Left Column - ETF Info */}
                <motion.div
                  className="w-full md:w-3/5 space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* ETF Header */}
                  <div className="bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/[0.1] p-4 md:p-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">BTC10 ETF</h1>
                    <p className="text-gray-300">The top BTC assets weighted by market cap</p>
                    
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
                      <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">TVL</p>
                        <p className="text-white text-xl font-bold">{tvl}</p>
                      </div>
                      <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">AUM</p>
                        <p className="text-white text-xl font-bold">{aum}</p>
                      </div>
                      <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">Volume (24h)</p>
                        <p className="text-white text-xl font-bold">{volume}</p>
                      </div>
                      <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">NAV Price</p>
                        <div className="flex items-center">
                          <p className="text-white text-xl font-bold mr-2">{tokenPrice}</p>
                          <span className={`text-sm ${priceChange.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                            {priceChange}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ETF Assets Table */}
                  <div className="bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/[0.1] p-4 md:p-6">
                    <h2 className="text-xl font-bold text-white mb-4">ETF Assets Under Management</h2>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase border-b border-white/10">
                          <tr>
                            <th className="px-3 py-3 w-[18%]">Asset</th>
                            <th className="px-3 py-3 w-[15%]">Current Weight</th>
                            <th className="px-3 py-3 w-[15%]">Target Weight</th>
                            <th className="px-3 py-3 w-[15%]">Market Cap</th>
                            <th className="px-3 py-3 w-[15%]">24h Change</th>
                            <th className="px-3 py-3 w-[22%]">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {etfAssets.map((asset, index) => (
                            <tr 
                              key={index} 
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="px-3 py-3 font-medium text-white">{asset.name}</td>
                              <td className="px-3 py-3 text-white">{asset.currentWeight}</td>
                              <td className="px-3 py-3 text-gray-300">{asset.targetWeight}</td>
                              <td className="px-3 py-3 text-white">{asset.marketCap}</td>
                              <td className={`px-3 py-3 ${asset.change24h.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                {asset.change24h}
                              </td>
                              <td className="px-3 py-3 text-gray-300">{asset.balance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
                
                {/* Right Column - Swap/Redeem Module */}
                <motion.div
                  className="w-full md:w-2/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="w-full bg-black/95 backdrop-blur-md rounded-xl p-6 border border-white/[0.12]">
                    {/* Mode Toggle */}
                    <div className="flex bg-black/40 rounded-lg p-1 mb-6">
                      <button
                        onClick={() => setMode("swap")}
                        className={`flex-1 py-2 rounded-md text-center transition-colors ${
                          mode === "swap" 
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" 
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Swap
                      </button>
                      <button
                        onClick={() => setMode("redeem")}
                        className={`flex-1 py-2 rounded-md text-center transition-colors ${
                          mode === "redeem" 
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" 
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Redeem
                      </button>
                    </div>
                    
                    {/* From Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-medium text-white">
                          Sell:
                        </h2>
                        <span className="text-white/60 text-sm">
                          Balance: {mode === "swap" 
                            ? (isSwapFlipped ? etfBalance : tbtcBalance) 
                            : etfBalance}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between bg-black/60 rounded-lg p-3 border border-white/10">
                          <input
                            type="text"
                            className="bg-transparent text-xl font-semibold text-white w-full outline-none"
                            placeholder="0.00"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(e.target.value)}
                          />
                          <div className="text-white/80 text-sm ml-2 inline-flex items-center whitespace-nowrap bg-white/10 px-3 py-1 rounded-lg">
                            {mode === "swap" 
                              ? (isSwapFlipped ? "BTC•TEN•ETF•TOKEN ▣" : "tBTC ₿") 
                              : "BTC•TEN•ETF•TOKEN ▣"}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-2 mr-1">
                          <button 
                            onClick={handleSetHalfSend}
                            className="text-white/60 hover:text-white text-xs transition-colors px-1"
                          >
                            Half
                          </button>
                          <button 
                            onClick={handleSetMaxSend}
                            className="text-white/60 hover:text-white text-xs transition-colors px-1"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Swap Direction Button */}
                    {mode === "swap" && (
                      <div className="relative h-12 flex items-center justify-center">
                        <motion.button
                          onClick={handleSwapTokens}
                          className="absolute text-white/80 hover:text-white transition-colors bg-black/80 p-2 rounded-full border border-white/10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="tabler-icon tabler-icon-switch-vertical w-5 h-5 mx-auto z-50"
                          >
                            <path d="M3 8l4 -4l4 4"></path>
                            <path d="M7 4l0 9"></path>
                            <path d="M13 16l4 4l4 -4"></path>
                            <path d="M17 10l0 10"></path>
                          </svg>
                        </motion.button>
                      </div>
                    )}
                    
                    {/* To Section */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-medium text-white">
                          {mode === "swap" ? "Buy:" : "You Will Receive:"}
                        </h2>
                        {mode === "swap" && (
                          <span className="text-white/60 text-sm">
                            Balance: {isSwapFlipped ? tbtcBalance : etfBalance}
                          </span>
                        )}
                      </div>
                      {mode === "swap" ? (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between bg-black/60 rounded-lg p-3 border border-white/10">
                            <input
                              type="text"
                              className="bg-transparent text-xl font-semibold text-white w-full outline-none"
                              placeholder="0.00"
                              value={getAmount}
                              onChange={(e) => setGetAmount(e.target.value)}
                              readOnly
                            />
                            <div className="text-white/80 text-sm ml-2 inline-flex items-center whitespace-nowrap bg-white/10 px-3 py-1 rounded-lg">
                              {isSwapFlipped ? "tBTC ₿" : "BTC•TEN•ETF•TOKEN ▣"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-black/60 rounded-lg p-3 border border-white/10">
                          <div className="mb-4">
                            <p className="text-white text-xl font-semibold">{estimatedValue}</p>
                          </div>
                          <div className="space-y-2">
                            {etfAssets.map((asset, index) => (
                              <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-white/5 last:border-0">
                                <span className="text-white">{asset.name}</span>
                                <span className="text-gray-300">
                                  {(parseFloat(sendAmount || "0") * (parseFloat(asset.currentWeight.replace("%", "")) / 100) * 1000).toFixed(2)} tokens
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <motion.button
                      onClick={handleProcessTransaction}
                      className="relative w-full px-6 py-2.5 text-base font-semibold text-white rounded-lg"
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isProcessing || !paymentAddress || sendAmount === "0"}
                    >
                      <div
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#FFA200] via-[#FF3000] to-[#FFA200]"
                        style={gradientAnimation}
                      />
                      <div className={`absolute inset-[1px] rounded-lg ${(!paymentAddress || sendAmount === "0") ? 'bg-black/95' : 'bg-black/80'} backdrop-blur-sm`} />
                      <span className="relative z-10 flex items-center justify-center">
                        {isProcessing ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {mode === "swap" ? "Swapping..." : "Redeeming..."}
                          </>
                        ) : !paymentAddress ? (
                          "Connect Wallet"
                        ) : sendAmount === "0" ? (
                          "Enter Amount"
                        ) : (
                          mode === "swap" ? "Swap" : "Redeem"
                        )}
                      </span>
                    </motion.button>
                    
                    {/* Success Message */}
                    <AnimatePresence>
                      {showSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center text-green-500"
                        >
                          {mode === "swap" ? "Swap completed successfully!" : "Redemption completed successfully!"}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
} 