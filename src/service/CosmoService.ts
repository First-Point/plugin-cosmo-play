import axios, { AxiosInstance } from "axios";
import {
    WalletResponse,
    WalletOptions,
    ChiknResponse,
    WalletNFTsResponse,
    FloorPriceResponse,
    RoostrResponse,
    FarmlandResponse,
    GetListingsResponse,
    CreateListingResponse,
    UpdateListingResponse,
    DeleteListingResponse,
    WalletAuthResponse,
    WalletVerifyResponse,
    WalletSummaryResponse,
    LeaderboardResponse,
    FloorHistoryResponse,
    FloorStatsResponse,
    TokenListResponse,
    TokenSearchResponse,
    TokenBySymbolResponse,
    TokenPriceResponse,
    ItemListResponse,
    FloorResponse,
    ListingsResponse,
    RoostrPriceResponse,
    FarmlandPriceResponse,
    BlueprintPriceResponse
} from "../types";
import { CosmoConfig } from "../environment";

export interface CosmoServiceConfig {
    apiBaseUrl: string;
    apiToken: string;
    apiKey: string;
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
                "x-api-key": config.apiKey,
                "Content-Type": "application/json",
            },
        });
    }

    async getChiknDetails(chiknId: string): Promise<ChiknResponse> {
        try {
            const response = await this.client.get<ChiknResponse>(
                `/api/item/chikn/${chiknId}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getWalletNFTs(
        address: string,
        type?: string,
        page?: number,
        limit?: number
    ): Promise<WalletNFTsResponse> {
        try {
            const queryParams = new Array<string>();
            if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
            if (page) queryParams.push(`page=${encodeURIComponent(page)}`);
            if (limit) queryParams.push(`limit=${encodeURIComponent(limit)}`);

            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const response = await this.client.get<WalletNFTsResponse>(
                `/wallet/${address}/${type || ''}${queryString}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFloorPrice(type: string): Promise<FloorPriceResponse> {
        try {
            const response = await this.client.get<FloorPriceResponse>(
                `/floor/price/${type}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getRoostrDetails(roostrId: string): Promise<RoostrResponse> {
        try {
            const response = await this.client.get<RoostrResponse>(
                `/api/item/roostr/${roostrId}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFarmlandDetails(farmlandId: string): Promise<FarmlandResponse> {
        try {
            const response = await this.client.get<FarmlandResponse>(
                `/api/item/farmland/${farmlandId}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getMarketListings(
        type?: string,
        page?: number,
        limit?: number,
        sortDesc?: string,
        filter?: Record<string, any>
    ): Promise<GetListingsResponse> {
        try {
            const queryParams = new Array<string>();
            if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
            if (page) queryParams.push(`page=${encodeURIComponent(page)}`);
            if (limit) queryParams.push(`limit=${encodeURIComponent(limit)}`);
            if (sortDesc) queryParams.push(`sortDesc=${encodeURIComponent(sortDesc)}`);
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    queryParams.push(`${key}=${encodeURIComponent(value)}`);
                });
            }

            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const response = await this.client.get<GetListingsResponse>(
                `/listing/list${queryString}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createMarketListing(
        tokenId: string,
        price: number,
        type: string
    ): Promise<CreateListingResponse> {
        try {
            const response = await this.client.post<CreateListingResponse>(
                '/listing/create',
                { tokenId, price, type }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateMarketListing(
        listingId: string,
        price: number
    ): Promise<UpdateListingResponse> {
        try {
            const response = await this.client.put<UpdateListingResponse>(
                `/listing/update/${listingId}`,
                { price }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deleteMarketListing(listingId: string): Promise<DeleteListingResponse> {
        try {
            const response = await this.client.delete<DeleteListingResponse>(
                `/listing/delete/${listingId}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async initiateWalletAuth(address: string): Promise<WalletAuthResponse> {
        try {
            const response = await this.client.post<WalletAuthResponse>(
                '/game/auth/sendWallet',
                { address }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async verifyWalletSignature(
        address: string,
        signature: string,
        nonce: string
    ): Promise<WalletVerifyResponse> {
        try {
            const response = await this.client.post<WalletVerifyResponse>(
                '/game/auth/verifySignature',
                { address, signature, nonce }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getWalletSummary(address: string): Promise<WalletSummaryResponse> {
        try {
            const response = await this.client.get<WalletSummaryResponse>(
                `/wallet/${address}/summary`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getLeaderboard(
        type: string,
        page?: number,
        limit?: number,
        sortAsc?: string
    ): Promise<LeaderboardResponse> {
        try {
            const queryParams = new Array<string>();
            if (page) queryParams.push(`page=${encodeURIComponent(page)}`);
            if (limit) queryParams.push(`limit=${encodeURIComponent(limit)}`);
            if (sortAsc) queryParams.push(`sortAsc=${encodeURIComponent(sortAsc)}`);

            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const response = await this.client.get<LeaderboardResponse>(
                `/reports/leaderboard/${type}${queryString}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFloorHistory(
        type: string,
        days?: number
    ): Promise<FloorHistoryResponse> {
        try {
            const queryParams = new Array<string>();
            if (days) queryParams.push(`days=${encodeURIComponent(days)}`);

            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const response = await this.client.get<FloorHistoryResponse>(
                `/floor/history/${type}${queryString}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFloorStats(type: string): Promise<FloorStatsResponse> {
        try {
            const response = await this.client.get<FloorStatsResponse>(
                `/floor/stats/${type}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Crypto Endpoints
    async getTokenList(limit?: number, start?: number, platform?: string, isActive?: boolean): Promise<TokenListResponse> {
        try {
            const params = new URLSearchParams();
            if (limit) params.append('limit', limit.toString());
            if (start) params.append('start', start.toString());
            if (platform) params.append('platform', platform);
            if (isActive !== undefined) params.append('isActive', isActive.toString());

            const response = await this.client.get<TokenListResponse>(`/crypto/map/tokens?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async searchTokens(query: string, limit?: number): Promise<TokenSearchResponse> {
        try {
            const params = new URLSearchParams();
            params.append('query', query);
            if (limit) params.append('limit', limit.toString());

            const response = await this.client.get<TokenSearchResponse>(`/crypto/map/tokens/search?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async findTokenBySymbol(symbol: string): Promise<TokenBySymbolResponse> {
        try {
            const response = await this.client.get<TokenBySymbolResponse>(`/crypto/map/tokens/symbol/${symbol}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getTokenPrice(symbol: string): Promise<TokenPriceResponse> {
        try {
            const response = await this.client.get<TokenPriceResponse>(`/crypto/prices/${symbol}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Chikn Farm Endpoints
    async getItemsList(options: {
        page?: number;
        limit?: number;
        type?: string;
        rarity?: string;
        forSale?: boolean;
    }): Promise<ItemListResponse> {
        try {
            const params = new URLSearchParams();
            if (options.page) params.append('page', options.page.toString());
            if (options.limit) params.append('limit', options.limit.toString());
            if (options.type) params.append('type', options.type);
            if (options.rarity) params.append('rarity', options.rarity);
            if (options.forSale !== undefined) params.append('forSale', options.forSale.toString());

            const response = await this.client.get<ItemListResponse>(`/chikn/item/list?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFloors(type: 'roostr' | 'farmland' | 'blueprint'): Promise<FloorResponse> {
        try {
            const response = await this.client.get<FloorResponse>(`/chikn/floors/${type}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getListings(type: 'roostr' | 'farmland' | 'blueprint', options: {
        page?: number;
        limit?: number;
        sortDesc?: string;
        filter?: Record<string, any>;
    }): Promise<ListingsResponse> {
        try {
            const params = new URLSearchParams();
            if (options.page) params.append('page', options.page.toString());
            if (options.limit) params.append('limit', options.limit.toString());
            if (options.sortDesc) params.append('sortDesc', options.sortDesc);
            
            if (options.filter) {
                Object.entries(options.filter).forEach(([key, value]) => {
                    params.append(`${key}`, value.toString());
                });
            }

            const response = await this.client.get<ListingsResponse>(`/chikn/listings/${type}?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getRoostrPrices(): Promise<RoostrPriceResponse> {
        try {
            const response = await this.client.get<RoostrPriceResponse>('/chikn/roostr/prices');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFarmlandPrices(): Promise<FarmlandPriceResponse> {
        try {
            const response = await this.client.get<FarmlandPriceResponse>('/chikn/farmland/prices');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getBlueprintPrices(): Promise<BlueprintPriceResponse> {
        try {
            const response = await this.client.get<BlueprintPriceResponse>('/chikn/blueprint/prices');
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
        apiKey: config.API_KEY,
        timeout: 5000,
    });
}
