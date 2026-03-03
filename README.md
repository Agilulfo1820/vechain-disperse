# disperse

Send VET or ERC-20 tokens to multiple recipients in a single VeChain transaction.

Built on VeChain's native **multi-clause transactions** — all transfers are batched into one atomic operation. No intermediary smart contract required.

## Features

- **Multi-clause batching** — every recipient receives funds in a single transaction (one signature, one gas fee, all-or-nothing)
- **VET and ERC-20 tokens** — toggle between native VET transfers and any token from the VeChain token registry
- **Token picker** — searchable dropdown with logos, symbols, and addresses fetched from the [VeChain token registry](https://github.com/vechain/token-registry)
- **VeChain Name Service** — paste `.vet` domains alongside `0x` addresses; they resolve automatically
- **Flexible input parsing** — accepts `address amount`, `address,amount`, CSV with headers, tabs, extra columns
- **Live validation** — real-time total calculation, remaining balance, and insufficient funds warning
- **Wallet integration** — connect via VeWorld, Sync2, or WalletConnect through [VeChain Kit](https://docs.vechainkit.vechain.org)

## How It Works

1. Connect your VeChain wallet
2. Choose **vet** or **token** mode
3. Paste or type recipients — one address (or `.vet` domain) and amount per line
4. Review the confirm table with totals and remaining balance
5. Click **disperse** — one transaction, all transfers

### Why no smart contract?

VeChain supports [multi-clause transactions](https://docs.vechain.org/core-concepts/transactions/multi-clause) at the protocol level. Each clause in a transaction can have its own recipient, value, and calldata. This means:

- **VET transfers**: each clause sends VET directly to a recipient
- **ERC-20 transfers**: each clause calls `transfer(address,uint256)` on the token contract

All clauses execute atomically — if one fails, they all revert. This gives the same guarantees as a disperse contract but without the deployment, approval steps, or extra gas overhead.

## Getting Started

### Prerequisites

- Node.js 20+ (managed via `.nvmrc`)
- A VeChain wallet (VeWorld, Sync2, or any WalletConnect-compatible wallet)

### Install

```bash
nvm use
npm install --legacy-peer-deps
```

### Configure

Create a `.env.local` file:

```bash
# Network: 'main' or 'test'
NEXT_PUBLIC_NETWORK=main

# Required for WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Input Format

The textarea accepts any of these formats:

```
0x314ab97b76e39d63c78d5c86c2daf8eaa306b182 3.141592
0x271bffabd0f79b8bd4d7a1c245b7ec5b576ea98a,1.618033
myname.vet 100
```

CSV with headers is also supported:

```
address,amount
0x314ab97b76e39d63c78d5c86c2daf8eaa306b182,3.141592
0x271bffabd0f79b8bd4d7a1c245b7ec5b576ea98a,1.618033
```

Extra columns are ignored — the parser finds the first valid address (or `.vet` domain) and the first positive number on each line.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Wallet | [@vechain/vechain-kit](https://www.npmjs.com/package/@vechain/vechain-kit) |
| Data fetching | TanStack React Query |
| Styling | Tailwind CSS v4 + custom CSS |
| Fonts | Playfair Display (serif) + JetBrains Mono |
| Token list | [VeChain token registry](https://github.com/vechain/token-registry) |
| Name resolution | [vet.domains](https://vet.domains) API |

## Project Structure

```
app/
  layout.tsx              # Root layout + providers
  page.tsx                # Entry point
  providers.tsx           # VeChainKitProvider + React Query
  globals.css             # Editorial typography + mint/ivory theme
  components/
    DisperseApp.tsx       # Main app (state, parsing, tx building, UI)
    TokenPicker.tsx       # Searchable token dropdown
  lib/
    parse.ts              # Input parsing, wei conversion, ABI encoding
    hooks.ts              # useVetBalance, useTokenBalance, useTokenRegistry, useResolveDomains
    types.ts              # TypeScript interfaces
    constants.ts          # ERC-20 ABI, node URLs, network helpers
```

## License

MIT
