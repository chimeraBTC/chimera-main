import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Update the gradient animation constant
const gradientAnimation = {
  backgroundSize: "200% 200%",
  animation: "gradient 2s linear infinite",
};

interface IHeader {
  connectWallet: () => void;
  selectWalletConnect: (e: number) => void;
  paymentAddress: string;
  setPaymentAddress: (e: string) => void;
  paymentPubkey: string;
  setPaymentPubkey: (e: string) => void;
  ordinalAddress: string;
  setOrdinalAddress: (e: string) => void;
  walletType: string;
  setWalletType: (e: string) => void;
  ordinalPubkey: string;
  setOrdinalPubkey: (e: string) => void;
  openWalletModal: boolean;
  setOpenWalletModal: (e: boolean) => void;
}

export default function Header(props: IHeader) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const userAddress = localStorage.getItem("paymentAddress");
    props.setPaymentAddress(userAddress ? userAddress : "");
    const ordinalAddress = localStorage.getItem("ordinalAddress");
    props.setOrdinalAddress(ordinalAddress ? ordinalAddress : "");
    const ordinalPubkey = localStorage.getItem("ordinalPubkey");
    props.setOrdinalPubkey(ordinalPubkey ? ordinalPubkey : "");
    const paymentPubkey = localStorage.getItem("paymentPubkey");
    props.setPaymentPubkey(paymentPubkey ? paymentPubkey : "");
    const walletType = localStorage.getItem("walletType");
    props.setWalletType(walletType ? walletType : "");
  }, []);

  return (
    <>
      {/* Header Bar */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm h-16"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto h-full px-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center"
          >
            <Image
              src="/chimera-wide.svg"
              alt="Chimera"
              width={180}
              height={40}
              className="h-8 w-auto"
            />
            
            {/* Navigation Links */}
            <div className="hidden md:flex ml-10 space-x-6">
              <div className="relative group">
                <button 
                  className="text-white/80 hover:text-white transition-colors flex items-center"
                >
                  Swap
                </button>
                <div className="absolute top-full left-0 mt-1 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link href="/" className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                    Hybrid
                  </Link>
                  <Link href="/swap" className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                    Token
                  </Link>
                </div>
              </div>
              <Link href="/lp" className="text-white/80 hover:text-white transition-colors">LP</Link>
              <Link href="/etf" className="text-white/80 hover:text-white transition-colors">ETF</Link>
              <Link href="/mint" className="text-white/80 hover:text-white transition-colors">Mint</Link>
              <Link href="/faq" className="text-white/80 hover:text-white transition-colors">FAQ</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-4"
          >
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <motion.button
              className="relative px-6 py-2 text-base font-semibold text-white rounded-lg"
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                props.connectWallet();
              }}
            >
              <div
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#FFA200] via-[#FF3000] to-[#FFA200]"
                style={gradientAnimation}
              />
              <div className="absolute inset-[1px] rounded-lg bg-black/95 backdrop-blur-sm" />
              <span className="relative z-10">
                {props.paymentAddress === ""
                  ? "Connect Wallet"
                  : props.paymentAddress.slice(0, 4) +
                    "..." +
                    props.paymentAddress.slice(-5)}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.header>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}></div>
            <motion.div 
              className="fixed top-16 right-0 bottom-0 w-64 bg-black/90 border-l border-white/10"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex flex-col p-4">
                <div className="py-2 border-b border-white/10">
                  <div className="mb-2">
                    <div className="text-white font-medium mb-2">Swap</div>
                    <Link href="/" className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      Hybrid
                    </Link>
                    <Link href="/swap" className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      Token
                    </Link>
                  </div>
                </div>
                <Link href="/lp" className="px-2 py-3 text-white/80 hover:text-white transition-colors border-b border-white/10" onClick={() => setMobileMenuOpen(false)}>LP</Link>
                <Link href="/etf" className="px-2 py-3 text-white/80 hover:text-white transition-colors border-b border-white/10" onClick={() => setMobileMenuOpen(false)}>ETF</Link>
                <Link href="/mint" className="px-2 py-3 text-white/80 hover:text-white transition-colors border-b border-white/10" onClick={() => setMobileMenuOpen(false)}>Mint</Link>
                <Link href="/faq" className="px-2 py-3 text-white/80 hover:text-white transition-colors border-b border-white/10" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error Modal */}
      <AnimatePresence>
        {props.openWalletModal && (
          <>
            <div className="fixed inset-0 flex items-center justify-center z-[100]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => props.setOpenWalletModal(false)}
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
                    Select Wallet
                  </h3>
                  <div className="flex justify-around">
                    <button
                      className="flex items-center gap-2 justify-center pointer"
                      onClick={() => {
                        props.selectWalletConnect(0);
                      }}
                    >
                      <div className="relative w-[50px] h-[50px]">
                        <Image
                          src={`/wallet/Unisat.png`}
                          alt={`Unisat`}
                          fill
                          className={`object-cover transition-transform duration-300`}
                        />
                      </div>
                      <p className="text-white text-2xl">Unisat</p>
                    </button>
                    <button
                      className="flex items-center gap-2 justify-center pointer"
                      onClick={() => {
                        props.selectWalletConnect(1);
                      }}
                    >
                      <div className="relative w-[50px] h-[50px]">
                        <Image
                          src={`/wallet/Xverse.png`}
                          alt={`XVerse`}
                          fill
                          className={`object-cover transition-transform duration-300`}
                        />
                      </div>
                      <p className="text-white text-2xl">XVerse</p>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
