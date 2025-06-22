import { useState, useEffect } from "react";
import Image from "next/image";
import { FaTwitter, FaDiscord } from "react-icons/fa";

export default function Footer() {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [mempoolFee, setMempoolFee] = useState<number | null>(null);

  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch("https://mempool.space/api/v1/prices");
        const data = await response.json();
        setBtcPrice(data["USD"]);
      } catch (error) {
        console.error("Error fetching BTC price:", error);
      }
    };

    const fetchMempoolFees = async () => {
      try {
        const response = await fetch(
          "https://mempool.space/api/v1/fees/recommended"
        );
        const data = await response.json();
        setMempoolFee(data.halfHourFee);
      } catch (error) {
        console.error("Error fetching mempool fees:", error);
      }
    };

    fetchBtcPrice();
    fetchMempoolFees();

    const priceInterval = setInterval(() => {
      fetchBtcPrice();
      fetchMempoolFees();
    }, 60000);

    return () => {
      clearInterval(priceInterval);
    };
  }, []);

  return (
    <footer className="fixed bottom-0 w-full h-[45px] bg-black/50 backdrop-blur-sm border-t border-gray-800 flex items-center justify-between px-3 z-50">
      <div className="flex items-center text-gray-400 space-x-3">
        <div className="flex items-center">
          <Image src="/btclogo.png" alt="Bitcoin Logo" width={14} height={14} />
          <span className="ml-1.5 text-sm">
            {btcPrice
              ? `$${btcPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "Loading..."}
          </span>
        </div>
        <div className="h-3 w-px bg-gray-800"></div>
        <div className="flex items-center">
          <a
            href="https://mempool.space/testnet4"
            className="text-gray-400 hover:text-white flex items-center relative group"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
              <div className="bg-black/90 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                Mempool Explorer
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 612 612"
              className="mr-1.5 text-gray-400 group-hover:text-white"
              fill="currentColor"
            >
              <g>
                <path d="M175.205,239.62c0.127-1.965-0.533-3.902-1.833-5.381l-58.84-66.941c-1.3-1.479-3.135-2.381-5.102-2.508 c-1.975-0.126-3.902,0.533-5.381,1.833c-27.037,23.766-49.479,51.794-66.706,83.305c-0.944,1.729-1.165,3.762-0.611,5.651 c0.554,1.89,1.836,3.483,3.565,4.427l78.205,42.748c1.131,0.619,2.352,0.912,3.557,0.912c2.627,0,5.174-1.398,6.523-3.866 c11.386-20.828,26.229-39.359,44.114-55.08C174.178,243.422,175.08,241.587,175.205,239.62z"/>
                <path d="M201.462,214.829c1.334,2.515,3.907,3.948,6.568,3.948c1.174,0,2.365-0.279,3.473-0.867 c20.962-11.117,43.512-18.371,67.025-21.561c4.064-0.551,6.913-4.293,6.362-8.358l-11.979-88.316 c-0.551-4.064-4.304-6.909-8.358-6.362c-35.708,4.843-69.949,15.857-101.772,32.736c-3.623,1.922-5.002,6.416-3.082,10.041 L201.462,214.829z"/>
                <path d="M105.785,334.345l-86.017-23.338c-1.901-0.514-3.929-0.255-5.638,0.725s-2.958,2.598-3.475,4.499 C3.586,342.295,0,369.309,0,396.523c0,4.657,0.111,9.329,0.342,14.284c0.185,3.981,3.468,7.083,7.414,7.083 c0.116,0,0.234-0.002,0.35-0.008l89.031-4.113c1.967-0.09,3.82-0.96,5.145-2.415c1.327-1.455,2.022-3.38,1.93-5.347 c-0.155-3.341-0.23-6.444-0.23-9.484c0-18.02,2.365-35.873,7.029-53.066C112.082,339.499,109.743,335.42,105.785,334.345z"/>
                <path d="M438.731,120.745c-32.411-15.625-67.04-25.308-102.925-28.786c-1.972-0.198-3.918,0.408-5.439,1.659 c-1.521,1.252-2.481,3.056-2.671,5.018l-8.593,88.712c-0.396,4.082,2.594,7.713,6.677,8.108 c23.652,2.291,46.463,8.669,67.8,18.954c1.015,0.49,2.118,0.738,3.225,0.738c0.826,0,1.654-0.139,2.45-0.416 c1.859-0.649,3.385-2.012,4.24-3.786l38.7-80.287C443.978,126.965,442.427,122.525,438.731,120.745z"/>
                <path d="M569.642,245.337c0.48-1.911,0.184-3.932-0.828-5.624c-18.432-30.835-41.933-57.983-69.848-80.686 c-1.529-1.242-3.48-1.824-5.447-1.627c-1.959,0.203-3.758,1.174-5,2.702l-56.237,69.144c-1.242,1.529-1.828,3.488-1.625,5.447 c0.201,1.959,1.173,3.758,2.702,5.002c18.47,15.019,34.015,32.975,46.205,53.369c1.392,2.326,3.855,3.618,6.383,3.618 c1.297,0,2.61-0.34,3.803-1.054l76.501-45.728C567.94,248.889,569.16,247.248,569.642,245.337z"/>
                <path d="M598.044,304.939c-1.228-3.915-5.397-6.096-9.308-4.867l-85.048,26.648c-3.915,1.226-6.093,5.393-4.867,9.306 c6.104,19.486,9.199,39.839,9.199,60.494c0,3.041-0.076,6.144-0.23,9.484c-0.092,1.967,0.602,3.892,1.93,5.347 c1.327,1.456,3.178,2.325,5.145,2.415l89.031,4.113c0.118,0.005,0.234,0.008,0.35,0.008c3.944,0,7.228-3.103,7.414-7.083 c0.229-4.955,0.342-9.627,0.342-14.284C612,365.306,607.306,334.494,598.044,304.939z"/>
                <path d="M305.737,380.755c-1.281,0-2.555,0.042-3.824,0.11l-120.65-71.185c-2.953-1.745-6.702-1.308-9.176,1.065 c-2.476,2.371-3.07,6.099-1.456,9.121l65.815,123.355c-0.242,2.376-0.371,4.775-0.371,7.195c0,18.608,7.246,36.101,20.403,49.258 c13.158,13.158,30.652,20.404,49.26,20.404c18.608,0,36.101-7.248,49.258-20.404c13.158-13.157,20.403-30.65,20.403-49.258 c0-18.608-7.246-36.101-20.403-49.258C341.839,388.001,324.344,380.755,305.737,380.755z"/>
              </g>
            </svg>
            <span className="text-sm">
              {mempoolFee ? `${mempoolFee} sats/vB` : "Loading..."}
            </span>
          </a>
        </div>
        <div className="h-3 w-px bg-gray-800"></div>
        <a
          href="https://faucet.testnet4.dev/"
          className="text-gray-400 hover:text-white flex items-center relative group"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
            <div className="bg-black/90 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
              tBTC Faucet
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2.0845 C 12 2.0845 19 8.25 19 13.5 C 19 17.6421 15.8137 21 12 21 C 8.1863 21 5 17.6421 5 13.5 C 5 8.25 12 2.0845 12 2.0845 Z"></path>
          </svg>
        </a>
      </div>
      <div className="flex items-center">
        <div className="h-3 w-px bg-gray-800 mx-2.5"></div>
        <a
          href="https://twitter.com/chimeraBTC"
          className="text-gray-400 hover:text-white mx-2.5"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaTwitter size={17} />
        </a>
        <a
          href="https://discord.gg/chimerabtc"
          className="text-gray-400 hover:text-white flex items-center mx-2.5"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaDiscord size={19} style={{ transform: 'translateY(-0.5px)' }} />
        </a>
      </div>
    </footer>
  );
}
