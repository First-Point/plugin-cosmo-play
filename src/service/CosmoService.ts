import axios, { AxiosInstance } from "axios";
import { WalletResponse, WalletOptions } from "../types";
import { CosmoConfig } from "../environment";

export interface CosmoServiceConfig {
    apiBaseUrl: string;
    apiToken: string;
    timeout?: number;
}

export class CosmoService {
    private readonly client: AxiosInstance;
    private readonly config: CosmoServiceConfig;

    constructor(config: CosmoServiceConfig) {
        this.config = config;
        this.client = axios.create({
            baseURL: config.apiBaseUrl,
            timeout: config.timeout || 5000,
            headers: {
                Authorization: `Bearer ${config.apiToken}`,
                "Content-Type": "application/json",
            },
        });
    }

    async createWallet(): Promise<WalletResponse> {
        try {
            const response = await this.client.post<WalletResponse>(
                "/api/wallet/create",
                {}
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getWalletDetails(address: string): Promise<WalletResponse> {
        try {
            const response = await this.client.get<WalletResponse>(
                `/api/wallet/details/${address}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async registerWallet(privateKey: string): Promise<WalletResponse> {
        try {
            const response = await this.client.post<WalletResponse>(
                "/api/wallet/register",
                { privateKey }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleError(error: any): Error {
        if (axios.isAxiosError(error)) {
            return new Error(
                error.response?.data?.message ||
                    "An error occurred with the API request"
            );
        }
        return error;
    }
}

export function createCosmoService(config: CosmoConfig): CosmoService {
    return new CosmoService({
        apiBaseUrl: config.API_BASE_URL,
        apiToken: config.API_TOKEN,
        timeout: 5000
    });
} 