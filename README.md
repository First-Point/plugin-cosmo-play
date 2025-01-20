# Plugin Cosmo Play

A Node.js plugin for the Eliza framework providing wallet management functionality.

## Installation

```bash
npm install plugin-cosmo-play
```

## Configuration

The plugin can be configured using environment variables or by passing configuration options directly:

```env
COSMO_PLAY_API_BASE_URL=https://api.example.com
COSMO_PLAY_API_TOKEN=your-api-token
COSMO_PLAY_TIMEOUT=5000
COSMO_PLAY_MAX_RETRIES=3
```

## Usage

```typescript
import { CosmoPlayPlugin } from "plugin-cosmo-play";

// Initialize the plugin
const plugin = new CosmoPlayPlugin({
  apiBaseUrl: "https://api.example.com",
  apiToken: "your-api-token",
});

// Create a new wallet
const newWallet = await plugin.createWallet();

// Get wallet details
const walletDetails = await plugin.getWalletDetails("wallet-address");

// Register a wallet with private key
const registeredWallet = await plugin.registerWallet("private-key");
```

## API Reference

### `createWallet(options?: WalletOptions): Promise<WalletResponse>`

Creates a new wallet with optional configuration.

### `getWalletDetails(address: string): Promise<WalletResponse>`

Retrieves details for a specific wallet address.

### `registerWallet(privateKey: string): Promise<WalletResponse>`

Registers an existing wallet using its private key.

## Types

```typescript
interface WalletResponse {
  status: "success" | "error";
  wallet: {
    address: string;
    publicKey: string;
    balance: number;
    metadata: {
      createdAt: string;
      updatedAt: string;
    };
  };
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Watch mode during development
npm run dev
```

## License

ISC
