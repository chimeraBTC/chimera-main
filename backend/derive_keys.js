import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

// Initialize ECC library for Bitcoin operations
bitcoin.initEccLib(ecc);

// Testnet4 network configuration
const TESTNET4_NETWORK = {
  bech32: 'tb',
  pubKeyHash: 0x1c,
  scriptHash: 0x16,
  wif: 0x3f,
};

const seedPhrase = "raccoon page remember city pill click dash trumpet dumb upset industry humble";

// Derive keys from seed phrase
const seed = bip39.mnemonicToSeedSync(seedPhrase);
const root = bip32.fromSeed(seed, TESTNET4_NETWORK);

// BIP84 derivation path for taproot: m/86'/1'/0'/0/0 (testnet = 1)
const child = root.derivePath("m/86'/1'/0'/0/0");

// Get private key in hex format
const privateKeyHex = child.privateKey.toString('hex');

// Get public key in hex format
const publicKeyHex = child.publicKey.toString('hex');

// Get compressed public key (33 bytes)
const compressedPublicKeyHex = child.publicKey.toString('hex');

// Create taproot address
const { address } = bitcoin.payments.p2tr({ 
  internalPubkey: child.publicKey.slice(1, 33), // Remove first byte for taproot
  network: TESTNET4_NETWORK 
});

console.log('Seed phrase:', seedPhrase);
console.log('Private key (hex):', privateKeyHex);
console.log('Public key (hex):', publicKeyHex);
console.log('Compressed public key (hex):', compressedPublicKeyHex);
console.log('Taproot address:', address);
console.log('Expected address: tb1pfytu6ks9v3g4k46mll2dj6gz8v46khnyyl7wuexhxguer40g4q5ssznlrk');