# CHIMERA Architecture

This document provides a detailed overview of the entire CHIMERA codebase, including the frontend, backend, and on-chain programs.

```
.
├── README.md
├── ARCHITECTURE.md
├── report.md
├── app/
│   ├── frontend/
│   │   ├── README.md
│   │   ├── next-env.d.ts
│   │   ├── next.config.mjs
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── components/
│   │   │   ├── Banner.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── header.tsx
│   │   │   └── WavyBackground.tsx
│   │   ├── pages/
│   │   │   ├── _app.tsx
│   │   │   ├── _document.tsx
│   │   │   ├── etf.tsx
│   │   │   ├── faq.tsx
│   │   │   ├── index.tsx
│   │   │   ├── lp.tsx
│   │   │   ├── mint.tsx
│   │   │   ├── swap.tsx
│   │   │   └── api/
│   │   │       └── hello.ts
│   │   ├── public/
│   │   │   ├── btclogo.png
│   │   │   ├── chimera-icon.svg
│   │   │   ├── chimera-logo.svg
│   │   │   ├── chimera-wide.svg
│   │   │   ├── speed.svg
│   │   │   ├── carousel/
│   │   │   │   ├── 1.png
│   │   │   │   ├── 2.png
│   │   │   │   ├── 3.png
│   │   │   │   ├── 4.png
│   │   │   │   ├── 5.png
│   │   │   │   ├── 6.png
│   │   │   │   ├── 7.png
│   │   │   │   ├── 8.png
│   │   │   │   ├── 9.png
│   │   │   │   ├── 10.png
│   │   │   │   ├── 11.png
│   │   │   │   ├── 12.png
│   │   │   │   └── 13.png
│   │   │   └── wallet/
│   │   │       ├── Unisat.png
│   │   │       └── Xverse.png
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── utils/
│   │       └── cn.ts
│   └── program/
│       ├── Cargo.lock
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── swap_inscription_rune.rs
│           └── swap_rune_inscription.rs
└── backend/
    ├── README.md
    ├── package.json
    ├── tsconfig.json
    ├── vercel.json
    ├── yarn.lock
    └── src/
        ├── app.ts
        ├── config/
        │   ├── config.ts
        │   ├── db.ts
        │   └── schema.ts
        ├── controller/
        │   ├── generatePSBT.Controller.ts
        │   ├── runeLP.Controller.ts
        │   ├── swap.Controller.ts
        │   └── userData.Controller.ts
        ├── model/
        │   ├── NftData/
        │   │   └── index.ts
        │   ├── RuneData/
        │   │   └── index.ts
        │   └── UserData/
        │       └── index.ts
        ├── routes/
        │   ├── index.ts
        │   ├── gnerateSwapPSBTRoute/
        │   │   └── index.ts
        │   ├── swapRoute/
        │   │   └── index.ts
        │   └── user/
        │       └── index.ts
        ├── types/
        │   └── type.ts
        └── utils/
            ├── psbt.service.ts
            ├── saturn.service.ts
            ├── utils.service.ts
            └── utxo.service.ts
``` 