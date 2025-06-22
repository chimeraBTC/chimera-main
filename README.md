# CHIMERA DeFi

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Technical Stack](#technical-stack)
5. [Security Considerations](#security-considerations)
6. [API Documentation](#api-documentation)
7. [Deployment & Operations](#deployment--operations)
8. [Development Roadmap](#development-roadmap)

## Project Overview

CHIMERA is a sophisticated DeFi platform built on the Bitcoin testnet, specifically designed to facilitate seamless swaps between Runes (a Bitcoin-based token standard) and Inscriptions (Bitcoin-native digital artifacts). The platform enables users to:

- Execute trustless swaps between Runes and Inscriptions
- Interact with Rune liquidity pools
- Manage digital assets through a secure, non-custodial interface

The system leverages Bitcoin's Partially Signed Bitcoin Transactions (PSBTs) for secure transaction handling and integrates with the Arch Network for smart contract functionality.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  User Interface │ ◄──►│  CHIMERA API    │ ◄──►│  Bitcoin Node   │
│  (Next.js/React)│     │  (Node.js/Expr) │     │  (Testnet4)     │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │  MongoDB        │     │  Arch Network   │
                        │  (Data Storage) │     │  Smart Contracts│
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
```

### Data Flow

1. **User Authentication**: Users connect their Bitcoin wallets (e.g., Unisat, Xverse) to the platform
2. **Asset Selection**: Users select assets to swap (Rune ↔ Inscription)
3. **Transaction Construction**: Backend constructs PSBTs for the desired operation
4. **User Approval**: User signs the transaction using their wallet
5. **Broadcast**: Signed transaction is broadcast to the Bitcoin network
6. **Confirmation**: Transaction is confirmed on the Bitcoin testnet

## Core Components

### 1. Backend Services

#### a) API Layer
- Built with Node.js and Express
- RESTful endpoints for all platform operations
- Input validation and sanitization
- Rate limiting and request validation

#### b) Core Services

1. **PSBT Service**
   - Constructs and validates PSBTs
   - Handles multi-signature transactions
   - Manages fee calculation and UTXO selection

2. **Saturn Service**
   - Interfaces with the Saturn SDK for Rune operations
   - Manages Rune token balances and transfers
   - Handles Rune-specific transaction logic

3. **UTXO Service**
   - Manages Bitcoin UTXOs
   - Implements UTXO selection algorithms
   - Handles change address management

4. **User Data Service**
   - Manages user profiles and preferences
   - Tracks transaction history
   - Handles authentication state

### 2. Smart Contracts

The platform utilizes smart contracts on the Arch Network for:

- Atomic swaps between Runes and Inscriptions
- Liquidity pool management
- Automated market making

### 3. Frontend

The project includes a modern Next.js + React frontend that provides:

- Wallet connection management
- Asset selection interfaces
- Transaction approval flows
- Portfolio tracking

## Technical Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ORM
- **Cryptography**: bitcoinjs-lib, tiny-secp256k1, bip322-js
- **Rune Protocol**: runelib
- **Smart Contracts**: Arch Network SDK

### Frontend
- **Next.js 13+** with App Router
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **Web3 Integration** for wallet connections
- **Responsive Design** for all device sizes

### Security
- PSBT-based transaction signing
- Client-side key management
- Input validation and sanitization
- Rate limiting on sensitive endpoints

### Development Tools
- TypeScript for type safety
- ESLint and Prettier for code quality
- Git for version control
- Vercel for deployment

## Security Considerations

### Implemented Security Measures
- PSBT-based signing (private keys never leave user's wallet)
- Input validation on all API endpoints
- Environment-based configuration
- Secure key management practices

### Recommended Improvements
1. **Input Validation**
   - Implement stricter validation for all user inputs
   - Add schema validation using libraries like Joi or Zod
   - Sanitize all user-provided data

2. **Error Handling**
   - Implement structured error responses
   - Avoid exposing sensitive error details
   - Add request/response logging with proper redaction

3. **Rate Limiting**
   - Implement more granular rate limiting
   - Add IP-based rate limiting
   - Consider implementing circuit breakers

4. **API Security**
   - Add request signing
   - Implement proper CORS policies
   - Add API key authentication for sensitive endpoints

## API Documentation

### Authentication
The API uses wallet-based authentication. Users must sign a challenge with their Bitcoin private key to authenticate.

### Endpoints

#### 1. Swap Endpoints

**POST /api/swap/pre-rune-inscribe-generate-psbt**
- Generate PSBT for Rune to Inscription swap
- Parameters:
  - `userAddress`: User's Bitcoin address
  - `userPubkey`: User's public key
  - `inscriptionId`: ID of the inscription to swap

**POST /api/swap/push-rune-inscribe-psbt-arch**
- Push signed PSBT for Rune to Inscription swap
- Parameters:
  - `signedPSBT`: PSBT signed by user's wallet

#### 2. Rune LP Endpoints

**POST /api/lp/deposit**
- Deposit Runes into liquidity pool
- Parameters:
  - `userAddress`: User's Bitcoin address
  - `runeAmount`: Amount of Runes to deposit

**POST /api/lp/withdraw**
- Withdraw Runes from liquidity pool
- Parameters:
  - `userAddress`: User's Bitcoin address
  - `lpTokens`: Amount of LP tokens to burn

#### 3. User Data Endpoints

**GET /api/user/balance/:address**
- Get user's Rune and Inscription balances
- Parameters:
  - `address`: User's Bitcoin address

**GET /api/user/transactions/:address**
- Get user's transaction history
- Parameters:
  - `address`: User's Bitcoin address

## Deployment & Operations

### Prerequisites
- Node.js 16+
- MongoDB 5.0+
- Bitcoin testnet4 node
- Arch Network node

### Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/chimera
BITCOIN_RPC_URL=http://localhost:18443
BITCOIN_RPC_USER=user
BITCOIN_RPC_PASS=password
ARCH_RPC_URL=https://arch-rpc.testnet4.ordinals.com
NODE_ENV=development
```

### Deployment Steps
1. Install dependencies: `yarn install`
2. Configure environment variables
3. Start MongoDB service
4. Run database migrations (if any)
5. Start the server: `yarn start`

## Development Roadmap

### Short-term
1. Implement comprehensive test suite
2. Add API documentation with Swagger/OpenAPI
3. Improve error handling and logging
4. Implement monitoring and alerting

### Medium-term
1. Support for additional wallet providers
2. Advanced order types (limit orders, etc.)
3. Improved liquidity pool features
4. Cross-chain swap capabilities

### Long-term
1. Mainnet launch
2. Decentralized governance
3. CHIMERA token integration
4. Advanced analytics and reporting

## Conclusion

CHIMERA represents a sophisticated implementation of DeFi primitives on the Bitcoin testnet, showcasing the potential for complex financial applications on Bitcoin's base layer. The architecture demonstrates a thoughtful approach to security, user experience, and scalability, while the use of modern development practices ensures maintainability and extensibility.

The platform's focus on non-custodial operations and client-side key management aligns with the core principles of decentralization and user sovereignty that are fundamental to the broader cryptocurrency ecosystem.
