export interface WalletMetadata {
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  address: string;
  publicKey: string;
  balance: number;
  metadata: WalletMetadata;
}

export interface WalletResponse {
  status: 'success' | 'error';
  wallet: Wallet;
}

export interface WalletOptions {
  walletType?: string;
}

export interface PluginConfig {
  apiBaseUrl: string;
  apiToken: string;
  timeout?: number;
  maxRetries?: number;
} 