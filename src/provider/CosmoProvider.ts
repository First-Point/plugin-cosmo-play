import axios, { AxiosInstance } from 'axios';
import { PluginConfig, Wallet, WalletResponse, WalletOptions } from '../types';

export class CosmoProvider {
  private readonly client: AxiosInstance;
  private readonly config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createWallet(options?: WalletOptions): Promise<WalletResponse> {
    try {
      const response = await this.client.post<WalletResponse>('/api/wallet/create', options);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWalletDetails(address: string): Promise<WalletResponse> {
    try {
      const response = await this.client.get<WalletResponse>(`/api/wallet/details/${address}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async registerWallet(privateKey: string): Promise<WalletResponse> {
    try {
      const response = await this.client.post<WalletResponse>('/api/wallet/register', { privateKey });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      return new Error(error.response?.data?.message || 'An error occurred with the API request');
    }
    return error;
  }
} 