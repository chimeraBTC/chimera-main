import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Banner = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '32px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: '45px',
              left: 0,
              width: '100%',
              backgroundColor: '#E53E3E',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9998,
              fontSize: '14px',
              padding: '0 16px',
              textAlign: 'center',
              overflow: 'hidden'
            }}
          >
            This dApp is in Beta on Testnet. The assets have no value. Please open a support ticket in Discord if you run into any bugs or errors.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Icon Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-[11px] right-[116px] hover:text-white transition-colors z-[60] flex items-center"
        style={{ 
          fontSize: '17px',
          color: isExpanded ? '#E53E3E' : '#D4A76A'
        }}
      >
        <div className="relative group">
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
            className="transition-transform duration-200"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {!isExpanded && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Show Testnet Warning
            </div>
          )}
        </div>
      </button>
    </>
  );
};

export default Banner; 