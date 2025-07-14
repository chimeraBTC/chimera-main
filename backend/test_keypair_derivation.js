/**
 * Test script to derive Bitcoin addresses from Arch program keypairs
 * This will help us find which keypair generates tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy
 */

import { RpcConnection, PubkeyUtil } from "@saturnbtcio/arch-sdk";

// Initialize RPC client
const RPC_URL = "http://127.0.0.1:9002";
const rpc = new RpcConnection(RPC_URL);

// Program keypairs from deployment
const programKeypair = [168,92,149,213,228,144,49,67,166,15,230,65,12,110,156,238,196,241,51,58,243,29,115,140,141,104,152,61,245,121,41,190,121,234,119,93,186,214,231,33,254,1,117,201,61,230,22,242,177,77,15,172,161,200,82,219,20,212,240,30,14,223,86,69];

const authorityKeypair = [216,45,117,189,69,167,86,106,233,16,142,158,164,232,87,123,204,38,102,146,122,114,90,199,169,94,29,58,241,160,24,78];

// Target address we want to match
const targetAddress = "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy";

async function testKeypairDerivation() {
  console.log("🔍 Testing Arch program keypair address derivation...\n");
  
  try {
    // Test program keypair
    console.log("📋 Program Keypair Analysis:");
    console.log("Full keypair length:", programKeypair.length);
    
    if (programKeypair.length === 64) {
      // Standard format: first 32 bytes = private key, last 32 bytes = public key
      const programPrivateKey = programKeypair.slice(0, 32);
      const programPublicKey = programKeypair.slice(32, 64);
      
      console.log("Private key (hex):", Buffer.from(programPrivateKey).toString('hex'));
      console.log("Public key (hex):", Buffer.from(programPublicKey).toString('hex'));
      
      const programAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(Buffer.from(programPublicKey).toString('hex'))
      );
      console.log("Derived Bitcoin address:", programAddress);
      console.log("Matches target?", programAddress === targetAddress);
      
    } else {
      // Might be just the private key, try to derive public key
      const programAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(Buffer.from(programKeypair).toString('hex'))
      );
      console.log("Derived Bitcoin address (treating as pubkey):", programAddress);
      console.log("Matches target?", programAddress === targetAddress);
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test authority keypair
    console.log("🔑 Authority Keypair Analysis:");
    console.log("Full keypair length:", authorityKeypair.length);
    
    if (authorityKeypair.length === 64) {
      // Standard format: first 32 bytes = private key, last 32 bytes = public key
      const authorityPrivateKey = authorityKeypair.slice(0, 32);
      const authorityPublicKey = authorityKeypair.slice(32, 64);
      
      console.log("Private key (hex):", Buffer.from(authorityPrivateKey).toString('hex'));
      console.log("Public key (hex):", Buffer.from(authorityPublicKey).toString('hex'));
      
      const authorityAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(Buffer.from(authorityPublicKey).toString('hex'))
      );
      console.log("Derived Bitcoin address:", authorityAddress);
      console.log("Matches target?", authorityAddress === targetAddress);
      
    } else if (authorityKeypair.length === 32) {
      // Might be just private key, try various interpretations
      console.log("Treating as 32-byte key...");
      
      try {
        const authorityAddress = await rpc.getAccountAddress(
          PubkeyUtil.fromHex(Buffer.from(authorityKeypair).toString('hex'))
        );
        console.log("Derived Bitcoin address (treating as pubkey):", authorityAddress);
        console.log("Matches target?", authorityAddress === targetAddress);
      } catch (error) {
        console.log("Error treating as pubkey:", error.message);
      }
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Also test the current ACCOUNT_PUBKEY for comparison
    console.log("📝 Current Config Analysis:");
    const currentPubkey = "5eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109";
    console.log("Current ACCOUNT_PUBKEY:", currentPubkey);
    
    try {
      const currentAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(currentPubkey)
      );
      console.log("Current derived address:", currentAddress);
      console.log("Matches target?", currentAddress === targetAddress);
    } catch (error) {
      console.log("Error with current pubkey:", error.message);
    }
    
    console.log("\n🎯 Target address:", targetAddress);
    console.log("\n✅ Run this script to find the correct keypair!");
    
  } catch (error) {
    console.error("❌ Error during derivation:", error);
    console.log("\n💡 Make sure your Arch RPC is running on http://127.0.0.1:9002");
  }
}

// Run the test
testKeypairDerivation().catch(console.error);