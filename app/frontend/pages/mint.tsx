import { Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  request,
  AddressPurpose,
  RpcErrorCode,
  signMultipleTransactions,
  BitcoinNetworkType,
  SignPsbtParams,
} from "sats-connect";
import WavyBackground from "@/components/WavyBackground";
import Footer from "@/components/Footer";
import { FaTwitter } from "react-icons/fa";
import { useState, useEffect } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import Header from "@/components/header";
import Banner from "@/components/Banner";

const inter = Inter({ subsets: ["latin"] });

// Array of image paths - you'll need to add these images to your public folder
const carouselImages = [
  "/carousel/1.png",
  "/carousel/2.png",
  "/carousel/3.png",
  "/carousel/4.png",
  "/carousel/5.png",
  "/carousel/6.png",
  "/carousel/7.png",
  "/carousel/8.png",
  "/carousel/9.png",
  "/carousel/10.png",
  "/carousel/11.png",
  "/carousel/12.png",
  "/carousel/13.png",
  // Add more images as needed
];

const gradientAnimation = {
  backgroundSize: "200% 200%",
  animation: "gradient 2s linear infinite",
};

export default function Home() {
  const backendUrl = "https://api.chimera.finance/api";

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mintedCount, setMintedCount] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [wlTimeRemaining, setWlTimeRemaining] = useState("");
  const [wlProgress, setWlProgress] = useState(0);
  const [publicProgress, setPublicProgress] = useState(0);
  const [publicTimeRemaining, setPublicTimeRemaining] = useState("");
  const totalSupply = 2000;
  const [isMinting, setIsMinting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setShowErrorMsg] = useState("");
  const [mintedImage, setMintedImage] = useState("");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [paymentPubkey, setPaymentPubkey] = useState("");
  const [ordinalAddress, setOrdinalAddress] = useState("");
  const [ordinalPubkey, setOrdinalPubkey] = useState("");
  const [walletType, setWalletType] = useState("");
  const [openWalletModal, setOpenWalletModal] = useState(false);

  useEffect(() => {
    fetchInscriptionCount();
    // Image carousel interval
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    const updateTimer = () => {
      const now = new Date();

      // Convert all times to UTC to avoid timezone issues
      const wlEndDate = new Date(Date.UTC(2025, 1, 13, 18, 0, 0)); // Feb 13, 2025, 1 PM EST = 18:00 UTC
      const wlStartDate = new Date(Date.UTC(2025, 1, 12, 18, 0, 0)); // Feb 12, 2025, 1 PM EST = 18:00 UTC
      const publicEndDate = new Date(Date.UTC(2025, 1, 14, 18, 0, 0)); // Feb 14, 2025, 1 PM EST = 18:00 UTC

      // Calculate time differences in milliseconds
      const wlTimeLeft = wlEndDate.getTime() - now.getTime();
      const publicTimeLeft = publicEndDate.getTime() - now.getTime();
      const wlTotalDuration = wlEndDate.getTime() - wlStartDate.getTime();
      const wlElapsed = now.getTime() - wlStartDate.getTime();

      // Calculate WL progress percentage
      const wlProgressPercent = Math.min(
        100,
        Math.max(0, (wlElapsed / wlTotalDuration) * 100)
      );

      // Format time remaining
      const formatTimeRemaining = (timeLeft: number): string => {
        if (timeLeft <= 0) return "00:00:00";
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      };

      // Update WL phase
      if (wlTimeLeft > 0) {
        setWlTimeRemaining(formatTimeRemaining(wlTimeLeft));
        setWlProgress(wlProgressPercent);
        setPublicProgress(0);
        setPublicTimeRemaining("24:00:00");
      }
      // Update Public phase
      else if (publicTimeLeft > 0) {
        setWlTimeRemaining("00:00:00");
        setWlProgress(100);
        setPublicTimeRemaining(formatTimeRemaining(publicTimeLeft));

        const publicElapsed = now.getTime() - wlEndDate.getTime();
        const publicTotalDuration =
          publicEndDate.getTime() - wlEndDate.getTime();
        const publicProgressPercent = Math.min(
          100,
          Math.max(0, (publicElapsed / publicTotalDuration) * 100)
        );
        setPublicProgress(publicProgressPercent);
      }
      // Both phases complete
      else {
        setWlTimeRemaining("00:00:00");
        setPublicTimeRemaining("00:00:00");
        setWlProgress(100);
        setPublicProgress(100);
      }
    };

    // Initial update
    updateTimer();

    // Update timer every second
    const timerInterval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(imageInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const claimInscription = async () => {
    try {
      if (ordinalAddress === "") throw "Connect Wallet";
      if (ordinalAddress.length !== 62) {
        setShowErrorModal(true);
        setShowErrorMsg("Check Your Wallet Address is Taproot");
        return false;
      }
      const res: any = await fetch(
        `${backendUrl}/swap/pre-claim-generate-psbt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userAddress: ordinalAddress,
            userPubkey: ordinalPubkey,
          }),
        }
      );

      const { psbt, signIndexes, inscriptionUtxo, error } = await res.json();
      if (error) {
        setShowErrorModal(true);
        setShowErrorMsg(error);
        return false;
      }
      console.log(psbt, signIndexes, inscriptionUtxo);
      const toSignInputs: {
        index: number;
        address: string;
        sighashTypes: number[];
      }[] = [];

      signIndexes.map((value: number) =>
        toSignInputs.push({
          index: value,
          address: ordinalAddress,
          sighashTypes: [129],
        })
      );

      const signedPsbt = await (window as any).unisat.signPsbt(psbt, {
        autoFinalized: false,
        toSignInputs,
      });

      const pushRes = await fetch(
        `${backendUrl}/swap/push-inscribe-rune-psbt-arch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userAddress: ordinalAddress,
            signedPSBT: signedPsbt,
            inscriptionUtxo,
            mint: true,
          }),
        }
      );

      const { txid, error: afterError } = await pushRes.json();
      if (afterError) {
        setShowErrorModal(true);
        setShowErrorMsg(afterError);
        return false;
      }
      console.log("Mint Txid => ", txid);
      setMintedImage(inscriptionUtxo.inscriptionId);
      return true;
    } catch (error) {
      setIsMinting(false);
      return false;
    }
  };

  const fetchInscriptionCount = async () => {
    try {
      const res = await fetch(`${backendUrl}/user/get-mint-count`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { count } = await res.json();
      setMintedCount(count);
    } catch (error) {
      console.log(error);
    }
  };

  const handleMint = async () => {
    setIsMinting(true);
    const claimResult = await claimInscription();
    if (claimResult) {
      setShowSuccessModal(true);
      fetchInscriptionCount();
    }
    setIsMinting(false);
  };

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

  return (
    <div className="overflow-hidden">
      <Banner />
      <main
        className={`flex min-h-screen flex-col items-center ${inter.className} overflow-x-hidden`}
      >
        <Head>
          <title>CHIMERA BTC</title>
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
                  <div className="flex flex-col md:flex-row">
                    {/* Image Carousel */}
                    <div
                      className="w-full md:w-1/2 relative aspect-square cursor-pointer"
                      onClick={() => setIsImageModalOpen(true)}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentImageIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={carouselImages[currentImageIndex]}
                            alt="Inscription Preview"
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Minting Info */}
                    <div className="w-full md:w-1/2 relative aspect-square">
                      <div className="absolute inset-0 p-6 md:p-8 flex flex-col">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-6">
                            CHIMERA GENESIS ◉▣
                          </h2>
                          <p className="text-gray-300 text-sm leading-relaxed mb-8">
                            CHIMERA GENESIS is a Hybrid Inscription collection
                            on L1 BTC. Each inscription can be converted into
                            100,000 CHIMERA•PROTOCOL Runes tokens and vice
                            versa. Swapping Runes back to Inscriptions
                            &ldquo;re-rolls&rdquo; for a new art piece each
                            time. Use the Runes to provide liquidity and earn
                            BTC yield on our Hybrid DEX AMM coming soon.
                            <br />
                            <br />
                          </p>

                          {/* Phase Progress Bars */}
                          <div className="space-y-6">
                            {/* WL Phase */}
                            <div>
                              <div className="flex justify-between text-sm text-gray-300 mb-2">
                                <span>
                                  WL Phase{" "}
                                  <span className="text-gray-500 ml-2">
                                    Max 2 per wallet
                                  </span>
                                </span>
                                <span>{wlTimeRemaining}</span>
                              </div>
                              <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${wlProgress}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>

                            {/* Public Phase */}
                            <div>
                              <div className="flex justify-between text-sm text-gray-300 mb-2">
                                <span>
                                  Public Phase{" "}
                                  <span className="text-gray-500 ml-2">
                                    Max 1 per wallet
                                  </span>
                                </span>
                              </div>
                              <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${
                                      (mintedCount / totalSupply) * 100
                                    }%`,
                                  }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section with Progress and Mint Button */}
                        <div className="mt-auto">
                          {/* Mint Progress */}
                          <div className="mb-4">
                            <div className="flex justify-between mb-4, mt-4">
                              <p className="text-[#FF6B00] text-sm opacity-80">
                                *You must wait for 1 block to confirm before
                                receiving and swapping your Inscriptions.
                              </p>
                            </div>
                            <div className="flex justify-between text-sm text-gray-300 mb-2 mt-4">
                              <span>Progress</span>
                              <span>
                                {mintedCount}/{totalSupply}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${
                                    (mintedCount / totalSupply) * 100
                                  }%`,
                                }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>

                          <motion.button
                            onClick={() => {
                              ordinalAddress && handleMint();
                            }}
                            className="relative w-full px-6 py-3 text-lg font-semibold text-white rounded-lg"
                            whileHover={{
                              scale: 1.02,
                              transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.98 }}
                            // disabled={isMinting}
                            disabled={true}
                          >
                            <div
                              className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#FFA200] via-[#FF3000] to-[#FFA200]"
                              style={gradientAnimation}
                            />
                            <div className="absolute inset-[1px] rounded-lg bg-black/95 backdrop-blur-sm" />
                            <span className="relative z-10 flex items-center justify-center">
                              {isMinting ? (
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
                                  Minting...
                                </>
                              ) : ordinalAddress ? (
                                "Mint"
                              ) : (
                                "Connect Wallet"
                              )}
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Next Button - Positioned relative to the modal */}
                {/* Removing the back button as requested */}
              </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
              {showSuccessModal && (
                <>
                  <div className="fixed inset-0 flex items-center justify-center z-[100]">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-md"
                      onClick={() => setShowSuccessModal(false)}
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
                          Congratulations!
                        </h3>
                        <div className="relative w-48 h-48 mx-auto mb-6">
                          <Image
                            src={`https://static-testnet4.unisat.io/content/${mintedImage}`}
                            alt="Minted Inscription"
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <p className="text-gray-300 mb-4">
                          You successfully minted:
                        </p>
                        <p className="font-mono text-white bg-black/50 rounded-lg p-3 mb-8 break-all">
                          Inscription ID: {mintedImage}
                        </p>
                        <p className="text-[#FF6B00] text-sm opacity-80 mb-8">
                          *You must wait for 1 block to confirm before receiving
                          and swapping your Inscriptions.
                        </p>
                        <motion.button
                          onClick={() => setShowSuccessModal(false)}
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
                        src={carouselImages[currentImageIndex]}
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
          </div>

          {/* Footer positioned at bottom */}
          <Footer />
        </div>
      </main>
    </div>
  );
}
