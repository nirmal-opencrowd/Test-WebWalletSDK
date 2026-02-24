# Dropp Web Wallet SDK

A web-based wallet for Hedera Hashgraph payments — converted from the Dropp Chrome Extension to a standalone web application.

## Overview

This project converts the Dropp browser extension wallet into a standard web application that can be accessed directly via any modern web browser, without requiring a browser extension installation.

### Key Features

- **Hedera Hashgraph** payments and account management
- **WalletConnect** integration for dApp connectivity
- **Magic SDK** authentication
- **Stripe** payment integration
- **Plaid** bank account linking
- QR code scanning and generation
- Transaction history and purchase tracking
- Recurring and pre-authorized payments

## Prerequisites

- Node.js >= 12.x
- npm >= 6.x

## Installation

```bash
git clone https://github.com/nirmal-opencrowd/Test-WebWalletSDK.git
cd Test-WebWalletSDK
npm install
cp .env.example .env
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start development server on port 3000 |
| `npm run build` | Create production build in `/build` |
| `npm test` | Run test suite |

## Project Structure

```
src/
├── api/              # Backend API communication layer
├── components/       # React UI components
│   ├── pages/        # Page-level components (Home, Login, etc.)
│   ├── Pay.js        # Payment flow
│   ├── WCApproval.js # WalletConnect approval
│   └── ...
├── helpers/          # WalletConnect connector & signer
├── services/         # Web service layer (converted from extension background)
│   └── walletService.js
├── styles/           # SCSS/CSS styles
├── utils/            # Utilities (storage, constants, helpers)
├── App.js            # Main application component
├── Routes.js         # Application routing (20+ routes)
├── Root.js           # Router wrapper
└── index.js          # Entry point
```

## Architecture Changes (Extension → Web)

| Chrome Extension | Web SDK |
|-----------------|---------|
| `chrome.storage.local` | `localStorage` |
| `chrome.runtime.sendMessage` | Custom event bus / direct calls |
| `chrome.windows.create` (popup) | React Router navigation |
| `chrome.tabs.create` | `window.open()` / navigation |
| `chrome.webRequest` | URL parameter parsing |
| Extension manifest | Standard web app |

## Origin

This project was converted from the Chrome extension codebase at `opencrowd/mps-portal` (`chrome/` directory).