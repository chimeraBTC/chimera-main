# System Architecture

This document provides a granular overview of the CHIMERA codebase, covering frontend, backend, and on-chain programs, data flow, and module responsibilities.

## 1. Project Structure
```
├── app/
│   ├── frontend/       # Next.js dApp
│   │   ├── components/ # React UI components
│   │   ├── pages/      # Next.js routes and API
│   │   ├── public/     # Static assets
│   │   ├── styles/     # Global styles
│   │   └── utils/      # Frontend utilities
│   └── program/        # On-chain Rust programs
│       ├── Cargo.toml  # Program config
│       └── src/        # Swap logic (lib.rs + modules)
├── backend/            # Node.js/Express API
│   ├── src/
│   │   ├── config/     # DB + env setup
│   │   ├── controller/ # Request handlers
│   │   ├── model/      # Mongoose schemas
│   │   ├── routes/     # Express routes
│   │   └── utils/      # Service layers (PSBT, UTXO, Saturn)
│   └── package.json    # Server scripts & deps
├── ARCHITECTURE.md     # High-level overview
├── AGENTS.md           # Agent guidelines
└── README.md           # Getting started
```

## 2. Frontend (app/frontend)
- **Framework:** Next.js + React 18 (TSX)
- **Styling:** Tailwind CSS
- **Key pages:**
  - `/index.tsx`: Landing
  - `/swap.tsx`, `/mint.tsx`, `/etf.tsx`: swap UIs
- **API routes:** `/api/hello.ts` demo
- **Components:** Banner, Footer, WavyBackground, header
- **Utilities:** `cn.ts` for classnames
- **Scripts:** `npm run dev|build|start|lint`

## 3. On-chain Program (app/program)
- **Language:** Rust (edition 2021)
- **Entrypoint:** `lib.rs` → `process_instruction`
- **Modules:**
  - `swap_inscription_rune.rs`: inscription→rune swap
  - `swap_rune_inscription.rs`: rune→inscription swap
- **Dependencies:** `arch_program`, `borsh`, `bitcoin`
- **Build/Test:** `cargo build`, `cargo test`, `cargo fmt`

## 4. Backend API (backend)
- **Runtime:** Node.js (ESM)
- **Framework:** Express + TypeScript
- **DB:** MongoDB via Mongoose
- **Core services:**
  - **PSBT Service:** constructs/verifies PSBTs
  - **UTXO Service:** selects and manages UTXOs
  - **Saturn Service:** interfaces with Arch Network
- **Controllers:** map routes→services (ETFswap, generatePSBT, runeLP, userData)
- **Scripts:** `npm run dev|build|start|test`

## 5. Data Flow
1. **User Interaction:** Next.js UI collects swap details
2. **API Request:** Frontend calls backend endpoints (`/api/swap/*`)
3. **PSBT Construction:** Backend PSBT service builds unsigned PSBT
4. **Signature:** Frontend wallet signs PSBT client-side
5. **Submission:** Signed PSBT returned to backend → broadcast
6. **On-chain Execution:** Rust program processes atomic swap via Arch Network

## 6. Error Handling & Logging
- Frontend: catch async errors, show UI feedback
- Backend: try/catch in controllers, standard JSON error shape
- Program: return `ProgramError` on invalid instruction

## 7. Conventions
- **Imports:** external → absolute (`@/`) → styles
- **Naming:** camelCase (JS/TS), snake_case (Rust)
- **Types:** explicit TS types, interfaces for props
- **Format:** Prettier + ESLint (`npm run lint`), `cargo fmt`

*Detailed reference for onboarding and maintenance*