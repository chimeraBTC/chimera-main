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
import { FaTwitter, FaDiscord } from "react-icons/fa";
import { useState, useEffect } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import Header from "@/components/header";
import Banner from "@/components/Banner";

const inter = Inter({ subsets: ["latin"] });

// Update the gradient animation constant
const gradientAnimation = {
  backgroundSize: "200% 200%",
  animation: "gradient 4s linear infinite",
};

export default function HybridSwap() {
  // const backendUrl = "https://api.chimera.finance/api";
  const backendUrl = "http://localhost:8001/api";

  const [isSwapFlipped, setIsSwapFlipped] = useState(false);
  const [sendAmount, setSendAmount] = useState<string>("1");
  const [getAmount, setGetAmount] = useState<string>("100,000");
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [chimeraBalance, setChimeraBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState("");
  const [paymentPubkey, setPaymentPubkey] = useState("");
  const [ordinalAddress, setOrdinalAddress] = useState("");
  const [ordinalPubkey, setOrdinalPubkey] = useState("");
  const [walletType, setWalletType] = useState("");
  const [inscriptionList, setInscriptionList] = useState<Array<string>>([]);
  const [broadcastTxId, setBroadcastTxId] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedModalImage, setSelectedModalImage] = useState<string>("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setShowErrorMsg] = useState("");
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [transactionSpeed, setTransactionSpeed] = useState<string>("fast");
  const [customFeeRate, setCustomFeeRate] = useState<string>("");
  const [showCustomFee, setShowCustomFee] = useState(false);

  useEffect(() => {
    fetchData();
  }, [paymentAddress]);

  const selectWalletConnect = async (walletType: number) => {
    try {
      if (walletType === 0) {
        const currentWindow: any = window;
        if (typeof currentWindow?.unisat !== "undefined") {
          const unisat: any = currentWindow?.unisat;
          try {
            const chain = await unisat.getChain();
            console.log(chain);
            if (chain.enum != "BITCOIN_TESTNET4")
              await unisat.switchChain("BITCOIN_TESTNET4");

            let accounts: string[] = await unisat.requestAccounts();
            let pubkey = await unisat.getPublicKey();

            const tempOrdinalAddress = accounts[0];
            const tempPaymentAddress = accounts[0];
            const tempOrdinalPublicKey = pubkey;
            const tempPaymentPublicKey = pubkey;
            localStorage.setItem("paymentAddress", tempPaymentAddress);
            localStorage.setItem("paymentPubkey", tempPaymentPublicKey);
            localStorage.setItem("ordinalAddress", tempOrdinalAddress);
            localStorage.setItem("ordinalPubkey", tempOrdinalPublicKey);
            localStorage.setItem("walletType", "unisat");
            setPaymentAddress(tempPaymentAddress);
            setPaymentPubkey(tempPaymentPublicKey);
            setOrdinalAddress(tempOrdinalAddress);
            setOrdinalPubkey(tempOrdinalPublicKey);
          } catch (e) {
            setShowErrorModal(true);
            setShowErrorMsg("Unisat Wallet Connection Failed");
            throw "Unisat Wallet Connection Failed";
          }
        }
      } else if (walletType === 1) {
        const response = await request("wallet_connect", null);
        if (response.status === "success") {
          const paymentAddressItem: any = response.result.addresses.find(
            (address) => address.purpose === AddressPurpose.Payment
          );
          const ordinalsAddressItem: any = response.result.addresses.find(
            (address) => address.purpose === AddressPurpose.Ordinals
          );

          if (!paymentAddressItem.address.includes("tb1")) {
            setShowErrorModal(true);
            setShowErrorMsg("Invalid Network!");
            throw "Invalid Network!";
          }

          localStorage.setItem("paymentAddress", paymentAddressItem.address);
          localStorage.setItem("paymentPubkey", paymentAddressItem.publicKey);
          localStorage.setItem("ordinalAddress", ordinalsAddressItem.address);
          localStorage.setItem("ordinalPubkey", ordinalsAddressItem.publicKey);
          localStorage.setItem("walletType", "xverse");
          setPaymentAddress(paymentAddressItem.address);
          setPaymentPubkey(paymentAddressItem.publicKey);
          setOrdinalAddress(ordinalsAddressItem.address);
          setOrdinalPubkey(ordinalsAddressItem.publicKey);
        } else {
          if (response.error.code === RpcErrorCode.USER_REJECTION) {
            // handle user cancellation error
          } else {
            console.log(response.error);
            setShowErrorModal(true);
            setShowErrorMsg("XVerse Wallet Connection Failed!");
            throw "XVerse Wallet Connection Failed";
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
    setOpenWalletModal(false);
  };

  const connectWallet = async () => {
    try {
      if (paymentAddress === "") {
        setOpenWalletModal(true);
      } else {
        localStorage.setItem("walletType", "");
        localStorage.setItem("paymentAddress", "");
        localStorage.setItem("paymentPubkey", "");
        localStorage.setItem("ordinalAddress", "");
        localStorage.setItem("ordinalPubkey", "");
        setPaymentAddress("");
        setPaymentPubkey("");
        setOrdinalAddress("");
        setOrdinalPubkey("");
      }
    } catch (error: any) {
      console.log(error);
      setShowErrorModal(true);
      setShowErrorMsg(error);
    }
  };

  const handleSwapDirection = () => {
    setIsSwapFlipped(!isSwapFlipped);
    // Swap the amounts
    const tempSend = sendAmount;
    setSendAmount(getAmount);
    setGetAmount(tempSend);
    // Set image selection based on swap direction
    setSelectedImage(!isSwapFlipped ? -1 : 0);
  };

  const handleImageSelect = (index: number) => {
    setSelectedImage(index);
  };

  const fetchData = async () => {
    if (ordinalAddress !== "") {
      setLoading(true);
      const res: any = await fetch(`${backendUrl}/user/get-rune-balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: ordinalAddress,
        }),
      });
      const { balance } = await res.json();
      setChimeraBalance(balance);

      const resInscription: any = await fetch(
        `${backendUrl}/user/get-inscription-list`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userAddress: ordinalAddress,
          }),
        }
      );
      const { inscriptions } = await resInscription.json();
      setInscriptionList(inscriptions);
      setLoading(false);
    } else {
      setChimeraBalance(0);
      setInscriptionList([]);
    }
  };

  const swapInscriptionRune = async (selectedInscriptioin: string) => {
    try {
      const walletType = localStorage.getItem("walletType");
      if (ordinalAddress === "") throw "Connect Wallet";
      if (inscriptionList.length === 0) throw "You Have Not Got Inscriptions";

      const res = await fetch(
        `${backendUrl}/swap/pre-rune-inscribe-generate-psbt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletType: walletType === "unisat" ? 0 : 1,
            userPaymentAddress: paymentAddress,
            userPaymentPubkey: paymentPubkey,
            userOrdinalAddress: ordinalAddress,
            userOrdinalPubkey: ordinalPubkey,
            inscriptionId: selectedInscriptioin,
          }),
        }
      );

      const {
        base64Psbt,
        hexPsbt,
        signPaymentIndexes,
        signOrdinalIndexes,
        runeUtxos,
        error,
      } = await res.json();

      if (error) {
        setShowErrorModal(true);
        setShowErrorMsg(error);
        return "";
      }

      let signedPsbt;

      if (walletType === "unisat") {
        const toSignInputs: {
          index: number;
          address: string;
          sighashTypes: number[];
        }[] = [];

        signPaymentIndexes.map((value: number) =>
          toSignInputs.push({
            index: value,
            address: ordinalAddress,
            sighashTypes: [129],
          })
        );
        signOrdinalIndexes.map((value: number) =>
          toSignInputs.push({
            index: value,
            address: ordinalAddress,
            sighashTypes: [129],
          })
        );

        signedPsbt = await (window as any).unisat.signPsbt(hexPsbt, {
          autoFinalized: false,
          toSignInputs,
        });
      } else {
        await signMultipleTransactions({
          payload: {
            network: {
              type: BitcoinNetworkType.Testnet4,
            },
            message: "Sign Transaction",
            psbts: [
              {
                psbtBase64: base64Psbt,
                inputsToSign: [
                  {
                    address: paymentAddress,
                    signingIndexes: signPaymentIndexes,
                    sigHash: 129,
                  },
                  {
                    address: ordinalAddress,
                    signingIndexes: signOrdinalIndexes,
                    sigHash: 129,
                  },
                ],
              },
            ],
          },
          onFinish: (response: any) => {
            signedPsbt = response[0].psbtBase64;
          },
          onCancel: () => console.log("Canceled"),
        });
      }

      const pushRes = await fetch(
        `${backendUrl}/swap/push-rune-inscribe-psbt-arch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletType: walletType === "unisat" ? 0 : 1,
            signedPSBT: signedPsbt,
            runeUtxos,
          }),
        }
      );

      const { txid } = await pushRes.json();

      return `https://mempool.space/testnet4/tx/${txid}`;
    } catch (error) {
      setIsSwapping(false);
      throw error;
    }
  };

  const swapRuneInscription = async () => {
    try {
      const walletType = localStorage.getItem("walletType");
      if (ordinalAddress === "") throw "Connect Wallet";
      const res = await fetch(
        `${backendUrl}/swap/pre-inscribe-rune-generate-psbt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletType: walletType === "unisat" ? 0 : 1,
            userPaymentAddress: paymentAddress,
            userPaymentPubkey: paymentPubkey,
            userOrdinalAddress: ordinalAddress,
            userOrdinalPubkey: ordinalPubkey,
          }),
        }
      );

      const {
        base64Psbt,
        hexPsbt,
        signPaymentIndexes,
        signOrdinalIndexes,
        inscriptionUtxo,
        error,
      } = await res.json();

      if (error) {
        setShowErrorModal(true);
        setShowErrorMsg(error);
        return "";
      }

      let signedPsbt;

      if (walletType === "unisat") {
        const toSignInputs: {
          index: number;
          address: string;
          sighashTypes: number[];
        }[] = [];

        signPaymentIndexes.map((value: number) =>
          toSignInputs.push({
            index: value,
            address: ordinalAddress,
            sighashTypes: [129],
          })
        );

        signOrdinalIndexes.map((value: number) =>
          toSignInputs.push({
            index: value,
            address: ordinalAddress,
            sighashTypes: [129],
          })
        );

        signedPsbt = await (window as any).unisat.signPsbt(hexPsbt, {
          autoFinalized: false,
          toSignInputs,
        });
      } else {
        await signMultipleTransactions({
          payload: {
            network: {
              type: BitcoinNetworkType.Testnet4,
            },
            message: "Sign Transaction",
            psbts: [
              {
                psbtBase64: base64Psbt,
                inputsToSign: [
                  {
                    address: paymentAddress,
                    signingIndexes: signPaymentIndexes,
                    sigHash: 129,
                  },
                  {
                    address: ordinalAddress,
                    signingIndexes: signOrdinalIndexes,
                    sigHash: 129,
                  },
                ],
              },
            ],
          },
          onFinish: (response: any) => {
            signedPsbt = response[0].psbtBase64;
          },
          onCancel: () => console.log("Canceled"),
        });
      }

      const pushRes = await fetch(
        `${backendUrl}/swap/push-inscribe-rune-psbt-arch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletType: walletType === "unisat" ? 0 : 1,
            userAddress: ordinalAddress,
            signedPSBT: signedPsbt,
            inscriptionUtxo,
          }),
        }
      );
      const { txid } = await pushRes.json();

      return `https://mempool.space/testnet4/tx/${txid}`;
    } catch (error) {
      setIsSwapping(false);
      return "";
      // throw error;
    }
  };

  const handleSwap = async () => {
    if (ordinalAddress.length !== 62) {
      setShowErrorModal(true);
      setShowErrorMsg("Check Your Wallet Address is Taproot");
      return;
    }

    setIsSwapping(true);
    let txid = "";
    if (isSwapFlipped) {
      txid = await swapRuneInscription();
    } else {
      txid = await swapInscriptionRune(inscriptionList[selectedImage]);
    }
    setIsSwapping(false);
    if (txid !== "") {
      setBroadcastTxId(txid);
      setShowSuccess(true);
      // Auto hide the success message after 10 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 10000);
      fetchData();
    }
  };

  return (
    <div className="overflow-hidden">
      <Banner />
      <main
        className={`flex min-h-screen flex-col items-center ${inter.className} overflow-x-hidden`}
      >
        <Head>
          <title>CHIMERA BTC - Hybrid Swap</title>
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
              openWalletModal={openWalletModal}
              setOpenWalletModal={setOpenWalletModal}
            />

            {/* Centered Module Container */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="w-full max-w-[1280px] flex flex-col items-center py-4 scale-[0.85] origin-center">
                <motion.div
                  className="w-full bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/[0.1]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
                    {/* Left Column - Image Grid */}
                    <div className="w-full md:w-1/2 flex items-center">
                      <div className="w-full">
                        <h2 className="text-xl font-medium text-white mb-3 text-center">
                          Your Inscriptions
                        </h2>
                        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/[0.07] hover:[&::-webkit-scrollbar-thumb]:bg-white/[0.15] [&::-webkit-scrollbar-track]:bg-transparent border border-white/[0.12]">
                          {inscriptionList.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                              {inscriptionList.map(
                                (image: string, index: number) => (
                                  <div
                                    key={index}
                                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                                      selectedImage === index && !isSwapFlipped
                                        ? "ring-2 ring-[#FF6B00] ring-offset-1 ring-offset-black/80"
                                        : ""
                                    }`}
                                    onClick={() => handleImageSelect(index)}
                                    onDoubleClick={() => {
                                      setSelectedModalImage(image);
                                      setIsImageModalOpen(true);
                                    }}
                                  >
                                    <Image
                                      src={`https://static-testnet4.unisat.io/content/${image}`}
                                      alt={`Inscription ${index + 1}`}
                                      fill
                                      className={`object-cover transition-transform duration-300 ${
                                        selectedImage === index
                                          ? "scale-105"
                                          : "hover:scale-105"
                                      }`}
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-gray-400 text-center">
                                No Inscriptions found from the CHIMERA GENESIS
                                collection.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Swap Module */}
                    <div className="w-full md:w-1/2 flex items-center justify-center">
                      <div className="w-full max-w-[400px] bg-black/95 backdrop-blur-md rounded-xl p-6 border border-white/[0.12]">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-medium text-white">
                              You Send:
                            </h2>
                            <span className="text-white/60 text-sm">
                              Balance:{" "}
                              {isSwapFlipped
                                ? chimeraBalance !== undefined
                                  ? chimeraBalance.toLocaleString()
                                  : 0
                                : inscriptionList.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-black/60 rounded-lg p-3 border border-white/10">
                            <input
                              type="text"
                              className="bg-transparent text-xl font-semibold text-white w-full outline-none"
                              placeholder={isSwapFlipped ? "100,000" : "1"}
                              value={sendAmount}
                              disabled={true}
                              onChange={(e) => setSendAmount(e.target.value)}
                            />
                            <span className="text-white/80 text-sm ml-2 inline-flex whitespace-nowrap">
                              {isSwapFlipped
                                ? "CHIMERA•PROTOCOL ▣"
                                : "INSCRIPTION ◉"}
                            </span>
                          </div>
                          <div className="flex justify-end space-x-3 mt-2 mr-1">
                            <button className="text-white/60 hover:text-white text-xs transition-colors px-1">
                              Half
                            </button>
                            <button className="text-white/60 hover:text-white text-xs transition-colors px-1">
                              Max
                            </button>
                          </div>
                        </div>

                        {/* Swap Direction Button */}
                        <div className="relative h-12 flex items-center justify-center">
                          <motion.button
                            onClick={handleSwapDirection}
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

                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-medium text-white">
                              You Get:
                            </h2>
                            <span className="text-white/60 text-sm">
                              Balance:{" "}
                              {isSwapFlipped
                                ? inscriptionList.length
                                : chimeraBalance !== undefined
                                ? chimeraBalance.toLocaleString()
                                : 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-black/60 rounded-lg p-3 border border-white/10">
                            <input
                              type="text"
                              className="bg-transparent text-xl font-semibold text-white w-full outline-none"
                              placeholder={isSwapFlipped ? "1" : "100,000"}
                              value={getAmount}
                              disabled={true}
                              onChange={(e) => setGetAmount(e.target.value)}
                            />
                            <span className="text-white/80 text-sm ml-2 inline-flex whitespace-nowrap">
                              {isSwapFlipped
                                ? "INSCRIPTION ◉"
                                : "CHIMERA•PROTOCOL ▣"}
                            </span>
                          </div>
                        </div>

                        <motion.button
                          onClick={() => {
                            ordinalAddress && handleSwap();
                          }}
                          className="relative w-full px-6 py-2.5 text-base font-semibold text-white rounded-lg"
                          whileHover={{
                            scale: 1.02,
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isSwapping}
                        >
                          <div
                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#FFA200] via-[#FF3000] to-[#FFA200]"
                            style={gradientAnimation}
                          />
                          <div className="absolute inset-[1px] rounded-lg bg-black/95 backdrop-blur-sm" />
                          <span className="relative z-10 flex items-center justify-center">
                            {loading ? (
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
                                Loading...
                              </>
                            ) : isSwapping ? (
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
                                Swapping...
                              </>
                            ) : ordinalAddress ? (
                              "Swap"
                            ) : (
                              "Connect Wallet"
                            )}
                          </span>
                        </motion.button>

                        {/* Advanced Options Toggle */}
                        <div className="mt-4">
                          <button 
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            className="text-white/70 hover:text-white text-sm flex items-center transition-colors"
                          >
                            <span>Advanced</span>
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              className={`ml-1 transition-transform duration-200 ${showAdvancedOptions ? 'rotate-180' : ''}`}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </button>
                        </div>
                        
                        {/* Advanced Options Section - Hidden by Default */}
                        {showAdvancedOptions && (
                          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                            <h3 className="text-white font-medium mb-2 text-sm">Advanced</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-white/70 text-xs">Transaction Speed</span>
                              <div className="flex space-x-1">
                                <button 
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    transactionSpeed === "normal" 
                                      ? "bg-[#FF6B00]/20 text-[#FF6B00]" 
                                      : "bg-white/10 hover:bg-white/20 text-white"
                                  }`}
                                  onClick={() => {
                                    setTransactionSpeed("normal");
                                    setShowCustomFee(false);
                                  }}
                                >
                                  Normal
                                </button>
                                <button 
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    transactionSpeed === "fast" 
                                      ? "bg-[#FF6B00]/20 text-[#FF6B00]" 
                                      : "bg-white/10 hover:bg-white/20 text-white"
                                  }`}
                                  onClick={() => {
                                    setTransactionSpeed("fast");
                                    setShowCustomFee(false);
                                  }}
                                >
                                  Fast
                                </button>
                                <button 
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    transactionSpeed === "custom" 
                                      ? "bg-[#FF6B00]/20 text-[#FF6B00]" 
                                      : "bg-white/10 hover:bg-white/20 text-white"
                                  }`}
                                  onClick={() => {
                                    setTransactionSpeed("custom");
                                    setShowCustomFee(true);
                                  }}
                                >
                                  Custom
                                </button>
                              </div>
                            </div>
                            {showCustomFee && (
                              <div className="mt-2 flex items-center">
                                <input
                                  type="text"
                                  className="bg-black/40 text-white text-xs p-1 rounded w-20 outline-none border border-white/10"
                                  placeholder="10"
                                  value={customFeeRate}
                                  onChange={(e) => setCustomFeeRate(e.target.value)}
                                />
                                <span className="text-white/70 text-xs ml-2">sats/vB</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Back Button - Positioned relative to the modal */}
                {/* <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link href="/mint">
                    <motion.span
                      className="text-white/80 hover:text-white text-lg font-medium cursor-pointer inline-block"
                      initial={{ y: 0 }}
                      animate={{
                        y: [-4, 4, -4],
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                    >
                      Next →
                    </motion.span>
                  </Link>
                </motion.div> */}
              </div>
            </div>
          </div>

          {/* Footer positioned at bottom */}
          <Footer />
        </div>

        {/* Success Notification */}
        <AnimatePresence>
          {showSuccess && (
            <div className="fixed inset-0 flex items-center justify-center z-[100]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setShowSuccess(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="pointer-events-auto bg-black/90 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-2xl min-w-[300px]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium">Swap Successful!</p>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="absolute inset-0 pointer-events-none">
                  <ConfettiExplosion
                    force={0.4}
                    duration={2200}
                    particleCount={30}
                    width={400}
                  />
                </div>
                <div className="mt-2">
                  <p className="text-white/60 text-base inline-flex whitespace-nowrap mb-2">
                    {isSwapFlipped
                      ? `You received 1 INSCRIPTION ◉`
                      : `You received 100,000 CHIMERA•PROTOCOL ▣`}
                  </p>
                  <a
                    href={broadcastTxId}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF6B00] hover:text-[#FF3000] text-sm block mt-2 transition-colors"
                  >
                    View tx in mempool
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Error Modal */}
        <AnimatePresence>
          {showErrorModal && (
            <>
              <div className="fixed inset-0 flex items-center justify-center z-[100]">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                  onClick={() => setShowErrorModal(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                  }}
                  className="relative bg-black/90 rounded-2xl p-8 max-w-lg w-full mx-4 border border-white/10 shadow-2xl z-[102]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-6">
                      Error!
                    </h3>
                    <p className="text-gray-300 mb-4">{errorMsg}</p>
                    <motion.button
                      onClick={() => setShowErrorModal(false)}
                      className="text-white/80 hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Close
                    </motion.button>
                  </div>
                </motion.div>
              </div>
              {/* Confetti above everything */}
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[999999]">
                <ConfettiExplosion
                  force={0.8}
                  duration={3000}
                  particleCount={100}
                  width={1600}
                />
              </div>
            </>
          )}
        </AnimatePresence>
        {/* Image Modal */}
        <AnimatePresence>
          {isImageModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-[100]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsImageModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-[90vw] h-[90vh] max-w-6xl max-h-[90vh] z-[101]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={`https://static-testnet4.unisat.io/content/${selectedModalImage}`}
                    alt="Enlarged Inscription Preview"
                    fill
                    className="object-contain"
                    priority
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsImageModalOpen(false);
                    }}
                    className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors duration-200 z-[102]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
