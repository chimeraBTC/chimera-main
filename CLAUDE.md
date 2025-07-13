# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CHIMERA is a sophisticated DeFi platform built on Bitcoin testnet4 that enables trustless atomic swaps between Runes (Bitcoin-based tokens) and Inscriptions (Bitcoin-native digital artifacts). The platform consists of three main components:

1. **Backend API** (Node.js/Express/MongoDB) - Handles PSBT generation, swap orchestration, and data management
2. **Frontend** (Next.js/React/TypeScript) - User interface for wallet connections and swap operations
3. **Smart Contracts** (Rust/Arch Network) - Trustless swap execution and validation

## Development Commands

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
yarn install

# Development mode with auto-reload
yarn dev

# Production build
yarn build

# Production start
yarn start

# Run with specific port
PORT=8001 yarn dev
```

### Frontend Development
```bash
# Navigate to frontend directory
cd app/frontend

# Install dependencies
npm install

# Development server (runs on port 3001)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Smart Contract Development
```bash
# Navigate to program directory
cd app/program

# Build the Rust program
cargo build

# Build with release optimizations
cargo build --release

# Check for compilation errors
cargo check
```

## Core Architecture

### Backend Service Layer Architecture

The backend follows a layered architecture with clear separation of concerns:

**Controllers** (`backend/src/controller/`)
- `generatePSBT.Controller.ts` - PSBT generation for various transaction types
- `ETFswap.Controller.ts` - Complex multi-token ETF swaps (1:10 ratio)
- `runeLP.Controller.ts` - Saturn DEX liquidity pool operations  
- `userData.Controller.ts` - User data retrieval operations

**Services** (`backend/src/utils/`)
- `psbt.service.ts` - Bitcoin transaction operations, fee estimation, broadcasting
- `saturn.service.ts` - Saturn API integration for Rune operations
- `utxo.service.ts` - UTXO management, validation, and fetching operations
- `utils.service.ts` - General utility functions

**Models** (`backend/src/model/`)
- `UserData/` - User operations and mint counts
- `RuneData/` - Rune token balances and transactions
- `NftData/` - NFT collection counters with optimistic concurrency

### Smart Contract Architecture

The Arch Network smart contracts are written in Rust and handle two primary operations:

**Swap Types:**
1. **Inscription → Rune** (`swap_inscription_rune.rs`)
   - Takes an inscription UTXO as input
   - Releases Rune tokens to user
   - Program signs the inscription input

2. **Rune → Inscription** (`swap_rune_inscription.rs`) 
   - Takes Rune UTXOs as inputs
   - Releases an inscription to user
   - Program signs the Rune inputs

**Transaction Flow:**
- User creates PSBT with their inputs/outputs
- Smart contract adds program-controlled inputs
- Program signs only its own inputs
- Transaction is broadcast atomically

### Frontend Component Structure

**Pages** (`app/frontend/pages/`)
- `index.tsx` - Hybrid swap (Inscription ↔ Rune)
- `swap.tsx` - Token swap interface (tBTC ↔ Runes)
- `lp.tsx` - Liquidity pool management
- `etf.tsx` - ETF token operations
- `mint.tsx` - NFT minting interface

**Components** (`app/frontend/components/`)
- `header.tsx` - Navigation with wallet connection
- `Banner.tsx` - Announcement banner
- `Footer.tsx` - Site footer
- `WavyBackground.tsx` - Animated background

## Key Technical Patterns

### PSBT-Based Transaction Flow

All Bitcoin transactions use Partially Signed Bitcoin Transactions (PSBTs):

1. **Backend generates PSBT** with:
   - User inputs (UTXOs to spend)
   - Program inputs (for smart contract)
   - Outputs (destination addresses)
   - Fee calculations

2. **Frontend handles signing**:
   - UNISAT wallet: Direct PSBT signing
   - XVERSE wallet: Uses sats-connect library
   - Different signature indexes for different wallet types

3. **Smart contract execution**:
   - Validates transaction structure
   - Signs program-controlled inputs
   - Broadcasts complete transaction

### Multi-Token ETF Swap System

The ETF redemption follows a complex 1:10 token distribution:

```typescript
// Token allocation percentages
SOURCE_RUNE_TOKEN_ID: 100% (input)
FIRST_RUNE_TOKEN_ID: 30%
SECOND_RUNE_TOKEN_ID: 20%  
THIRD_RUNE_TOKEN_ID: 15%
FOURTH_RUNE_TOKEN_ID: 10%
FIFTH_RUNE_TOKEN_ID: 7%
SIXTH_RUNE_TOKEN_ID: 5%
SEVENTH_RUNE_TOKEN_ID: 4%
EIGHTH_RUNE_TOKEN_ID: 3%
NINTH_RUNE_TOKEN_ID: 3%
```

The swap requires 4 separate PSBTs executed atomically to handle the complex token distribution.

### Database Integration Patterns

**MongoDB Models** with specific patterns:
- **Optimistic Concurrency Control** on NFTData to prevent race conditions during mints
- **Indexed queries** on userAddress, runeID, and txid fields for performance
- **Automatic timestamps** for audit trails
- **Data validation** with minimum value constraints

### Wallet Integration Patterns

**Dual Wallet Support:**
```typescript
// UNISAT Wallet (Type 0)
- Single address for both payment and ordinals
- Direct PSBT signing with toSignInputs array
- Chain switching to BITCOIN_TESTNET4

// XVERSE Wallet (Type 1)  
- Separate payment and ordinal addresses
- Uses sats-connect for transaction signing
- AddressPurpose enum for address types
```

### API Configuration Patterns

**Environment-Based Configuration:**
- `TEST_MODE` flag switches between testnet4 and mainnet endpoints
- Smart contract pubkeys configured per environment
- Mempool API endpoints automatically selected
- Database connections and external service URLs configured per environment

### Security Implementation Patterns

**Transaction Security:**
- BIP-322 message signing for authentication
- UTXO validation before transaction construction
- Rate limiting on sensitive endpoints (claiming, minting)
- Input sanitization and validation on all API endpoints

**Key Management:**
- Private keys never exposed to client
- Smart contract account separation
- Environment variable configuration for sensitive data

## Testing and Validation

### Backend Testing
```bash
# Validate PSBT generation
# Test endpoint: POST /api/swap/pre-rune-inscribe-generate-psbt

# Test user data retrieval  
# Test endpoint: POST /api/user/get-rune-balance

# Test ETF swap generation
# Test endpoint: POST /api/etf/pre-generate-etf-swap
```

### Frontend Testing
- Connect both UNISAT and XVERSE wallets
- Test all swap directions (inscription ↔ rune, tBTC ↔ rune)
- Verify transaction signing flows
- Test responsive design on mobile devices

### Smart Contract Testing
```bash
# Test inscription → rune swap
# Instruction data: [0, ...SwapInscriptionRuneParams]

# Test rune → inscription swap  
# Instruction data: [1, ...SwapRuneInscriptionParams]
```

## Common Development Workflows

### Adding New Rune Token Support
1. Add token configuration to `backend/src/config/config.ts`
2. Update ETF distribution logic in `ETFswap.Controller.ts`
3. Add token selection to frontend swap interfaces
4. Test token balance fetching and swap generation

### Implementing New Swap Types
1. Create new smart contract module in `app/program/src/`
2. Add instruction handling in `lib.rs`
3. Create corresponding controller in `backend/src/controller/`
4. Add API routes in `backend/src/routes/`
5. Update frontend to support new swap type

### Database Schema Changes
1. Update model in `backend/src/model/`
2. Consider migration strategy for existing data
3. Update corresponding controllers and services
4. Test with optimistic concurrency if applicable

### Debugging Transaction Issues
1. Check UTXO availability with `fetchBTCUtxo()` or `fetchRuneUTXO()`
2. Validate PSBT generation in relevant controller
3. Verify wallet signing process in frontend
4. Check smart contract logs for execution errors
5. Confirm transaction broadcast success

## Important Configuration Notes

### Network Configuration
- **Testnet4**: Currently configured network for all operations
- **Mempool API**: `https://mempool.space/testnet4/api` for transaction data
- **GoMaestro API**: UTXO and balance data source with API key authentication
- **Saturn API**: Rune trading and liquidity operations

### Smart Contract Addresses
- **Main Contract**: `393cd8d2c014d9e25b31a8a8407ff00986d9f84f40055545aacab3f05dd93240`
- **Swap Contract**: `91d402e0373f71cd86ca53bc623912bb47a350015bcf5aafa7be9e3fc202e895`
- **Arch RPC**: `http://127.0.0.1:9002` (local development)

### Development Environment Variables
```bash
# Backend (.env)
MONGO_URI=mongodb://localhost:27017/chimera
GOMAESTRO_PRIVATE_KEY=your_api_key
SATURN_KEY=your_saturn_api_key
UNISAT_KEY=your_unisat_api_key

# Frontend (environment variables)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001/api
```

### Performance Considerations
- **UTXO Fetching**: Implements pagination and rate limiting for large wallets
- **Concurrent Operations**: Uses Promise.all for parallel UTXO validation
- **Caching**: 15-minute cache on external API calls to reduce load
- **Error Handling**: Exponential backoff for rate-limited API calls

This architecture enables secure, trustless swaps between Bitcoin-native assets while maintaining compatibility with existing wallet infrastructure and providing a smooth user experience.