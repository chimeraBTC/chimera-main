/**
 * Check the Bitcoin addresses derived from old keys to understand their usage
 */

// Use built-in fetch (Node.js 18+)

// Bitcoin addresses derived from old working keys
const privateKeyAddress = "tb1ptkxt3zdh3dxsnathldr3eyacrr26nr6cld05t047yymerr8znh7s4s493e";
const accountPubkeyAddress = "tb1p862ncpsvrhaty3tw48en0yzuz90qetyugw82fs3uy5a6m46fkhpq6g7xcx";

// Mempool API for testnet4
const MEMPOOL_API = "https://mempool.space/testnet4/api";

async function checkAddress(address, name) {
  console.log(`\n🔍 CHECKING ${name}:`);
  console.log(`Address: ${address}`);
  
  try {
    // Get address info
    const response = await fetch(`${MEMPOOL_API}/address/${address}`);
    if (!response.ok) {
      console.log(`❌ Error fetching address info: ${response.status}`);
      return;
    }
    
    const addressInfo = await response.json();
    console.log(`Balance: ${addressInfo.chain_stats.funded_txo_sum} sats`);
    console.log(`Total received: ${addressInfo.chain_stats.funded_txo_sum} sats`);
    console.log(`Total sent: ${addressInfo.chain_stats.spent_txo_sum} sats`);
    console.log(`Transaction count: ${addressInfo.chain_stats.tx_count}`);
    
    if (addressInfo.chain_stats.tx_count > 0) {
      console.log("📋 Recent transactions:");
      
      // Get transactions
      const txResponse = await fetch(`${MEMPOOL_API}/address/${address}/txs`);
      if (txResponse.ok) {
        const txs = await txResponse.json();
        
        for (let i = 0; i < Math.min(5, txs.length); i++) {
          const tx = txs[i];
          console.log(`  • ${tx.txid} (${new Date(tx.status.block_time * 1000).toISOString()})`);
          
          // Check if this address is an input or output
          const isInput = tx.vin.some(input => input.prevout && input.prevout.scriptpubkey_address === address);
          const isOutput = tx.vout.some(output => output.scriptpubkey_address === address);
          
          console.log(`    Role: ${isInput ? 'Sender' : ''} ${isOutput ? 'Receiver' : ''}`);
        }
      }
    } else {
      console.log("📭 No transactions found");
    }
    
    // Get UTXOs
    const utxoResponse = await fetch(`${MEMPOOL_API}/address/${address}/utxo`);
    if (utxoResponse.ok) {
      const utxos = await utxoResponse.json();
      console.log(`💰 Current UTXOs: ${utxos.length}`);
      
      if (utxos.length > 0) {
        console.log("UTXO details:");
        utxos.forEach((utxo, i) => {
          console.log(`  ${i+1}. ${utxo.txid}:${utxo.vout} - ${utxo.value} sats`);
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Error checking address: ${error.message}`);
  }
}

async function analyzeOldArchitecture() {
  console.log("🏗️ ANALYZING OLD WORKING ARCHITECTURE");
  console.log("=".repeat(60));
  
  console.log("\n📊 Key Summary:");
  console.log("🔑 ARCH_PRIVATE_KEY: 9d661e76319fc4a151c7857549172c44d9c9d9682ac2233ea8cde251f6378a8a");
  console.log("🔑 ACCOUNT_PUBKEY: ca74c4777b9a4753bd401751d9c33539b9352a152ab92d63a97fd0ab699a0835");
  console.log("\n🏠 Derived Addresses:");
  console.log("📧 Private Key → ", privateKeyAddress);
  console.log("📧 Account Pubkey → ", accountPubkeyAddress);
  
  // Check both addresses
  await checkAddress(privateKeyAddress, "PRIVATE KEY ADDRESS");
  await checkAddress(accountPubkeyAddress, "ACCOUNT PUBKEY ADDRESS");
  
  console.log("\n" + "=".repeat(60));
  console.log("\n🎯 ARCHITECTURE INSIGHTS:");
  console.log("• ARCH_PRIVATE_KEY generates a Bitcoin address for signing");
  console.log("• ACCOUNT_PUBKEY generates a separate Bitcoin escrow address");
  console.log("• These serve different functions in the Arch swap system");
  console.log("• Check transaction history above to understand their roles");
  
  console.log("\n✅ Analysis complete! Check which address has activity to understand the working architecture.");
}

// Run the analysis
analyzeOldArchitecture().catch(console.error);