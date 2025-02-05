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

export interface ChiknResponse {
    success: boolean;
    data: {
        id: string;
        tokenId: string;
        owner: string;
        metadata: {
            name: string;
            description: string;
            image: string;
            attributes: {
                kg: number;
                kgRank: number;
                rarity: string;
                generation: number;
                level: number;
                experience: number;
                // Add other attributes as needed
            }
        }
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface WalletNFTsResponse {
    success: boolean;
    data: {
        items: Array<{
            id: string;
            tokenId: string;
            type: string;
            metadata: {
                name: string;
                description: string;
                image: string;
                attributes: Record<string, any>;
            };
        }>;
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface FloorPriceResponse {
    success: boolean;
    data: {
        type: string;
        price: number;
        currency: string;
        lastUpdated: string;
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface RoostrResponse {
    success: boolean;
    data: {
        id: string;
        tokenId: string;
        owner: string;
        metadata: {
            name: string;
            description: string;
            image: string;
            attributes: {
                strength: number;
                speed: number;
                intelligence: number;
                fertility: number;
                rarity: string;
                generation: number;
                level: number;
                experience: number;
            }
        }
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface FarmlandResponse {
    success: boolean;
    data: {
        id: string;
        tokenId: string;
        owner: string;
        metadata: {
            name: string;
            description: string;
            image: string;
            attributes: {
                size: number;
                fertility: number;
                yield: number;
                rarity: string;
                type: string;
                level: number;
                experience: number;
            }
        }
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface MarketListing {
    id: string;
    tokenId: string;
    type: string;
    price: number;
    seller: string;
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'sold' | 'cancelled';
}

export interface GetListingsResponse {
    success: boolean;
    data: {
        items: MarketListing[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface CreateListingResponse {
    success: boolean;
    data: {
        listing: MarketListing;
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface UpdateListingResponse {
    success: boolean;
    data: {
        listing: MarketListing;
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface DeleteListingResponse {
    success: boolean;
    data: {
        id: string;
        status: 'cancelled';
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface WalletAuthResponse {
    success: boolean;
    data: {
        nonce: string;
        message: string;
        expiresAt: string;
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface WalletVerifyResponse {
    success: boolean;
    data: {
        token: string;
        expiresAt: string;
        wallet: {
            address: string;
            verified: boolean;
        };
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface WalletSummaryResponse {
    success: boolean;
    data: {
        address: string;
        balance: string;
        nfts: {
            chikns: number;
            roostrs: number;
            farmlands: number;
            blueprints: number;
            items: number;
            drips: number;
        };
        stats: {
            totalValue: string;
            avgKg: number;
            avgLevel: number;
        };
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface LeaderboardEntry {
    rank: number;
    address: string;
    score: number;
    nfts: number;
    lastUpdated: string;
}

export interface LeaderboardResponse {
    success: boolean;
    data: {
        type: string;
        entries: LeaderboardEntry[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface FloorHistoryEntry {
    timestamp: string;
    price: number;
    volume: number;
    sales: number;
}

export interface FloorHistoryResponse {
    success: boolean;
    data: {
        type: string;
        history: FloorHistoryEntry[];
        period: {
            start: string;
            end: string;
            days: number;
        };
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface FloorStatsResponse {
    success: boolean;
    data: {
        type: string;
        stats: {
            currentFloor: number;
            avgPrice24h: number;
            volume24h: number;
            sales24h: number;
            change24h: number;
            change7d: number;
            allTimeHigh: number;
            allTimeLow: number;
        };
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

// Base response interface
export interface BaseResponse {
    success: boolean;
    metadata: {
        timestamp: string;
        source: string;
    };
}

// Crypto Types
export interface TokenInfo {
    id: string;
    name: string;
    symbol: string;
    platform: string;
    address?: string;
    isActive: boolean;
}

export interface TokenListResponse extends BaseResponse {
    data: {
        tokens: TokenInfo[];
        pagination: {
            total: number;
            page: number;
            limit: number;
        };
    };
}

export interface TokenSearchResponse extends BaseResponse {
    data: {
        results: TokenInfo[];
    };
}

export interface TokenBySymbolResponse extends BaseResponse {
    data: TokenInfo;
}

export interface TokenPrice {
    symbol: string;
    price: number;
    currency: string;
    timestamp: string;
}

export interface TokenPriceResponse extends BaseResponse {
    data: TokenPrice;
}

// Chikn Types
export interface WalletSummaryResponse extends BaseResponse {
    data: {
        address: string;
        balance: string;
        assets: {
            chikn: number;
            roostr: number;
            farmland: number;
            blueprint: number;
            items: number;
        };
        value: {
            total: string;
            breakdown: {
                chikn: string;
                roostr: string;
                farmland: string;
                blueprint: string;
                items: string;
            };
        };
    };
}

export interface ItemInfo {
    id: string;
    type: string;
    rarity: string;
    name: string;
    description: string;
    image: string;
    price?: number;
    forSale: boolean;
}

export interface ItemListResponse extends BaseResponse {
    data: {
        items: ItemInfo[];
        pagination: {
            total: number;
            page: number;
            limit: number;
        };
    };
}

export interface FloorPrice {
    price: number;
    currency: string;
    lastUpdated: string;
}

export interface FloorResponse extends BaseResponse {
    data: {
        type: string;
        floor: FloorPrice;
        stats: {
            volume24h: number;
            sales24h: number;
            avgPrice24h: number;
        };
    };
}

export interface ListingInfo {
    id: string;
    type: string;
    tokenId: string;
    price: number;
    seller: string;
    attributes: Record<string, any>;
    forSale: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RoostrListingItem {
    token: string;
    name: string;
    salePrice: number;
    rarity: string;
    owner: string;
}

export interface BlueprintListingItem {
    name: string;
    salePrice: number;
    rarity: string;
    owner: string;
}

export interface FarmlandListingItem {
    token: string;
    rarity: string;
    bigness: string;
    salePrice: number;
    wormInLand: number;
    size: string;
    name: string;
    owner: string;
}

export interface ListingsResponse<T = RoostrListingItem | BlueprintListingItem | FarmlandListingItem> extends BaseResponse {
    data: T[];
    pagination: Record<string, any>;
}

export interface RoostrPriceData {
    common: number;
    nice: number;
    rare: number;
    elite: number;
    legendary: number;
    unique: number;
    _overall: number;
    timestamp: string;
    network: string;
    currency: string;
    cached: boolean;
}

export interface RoostrPriceResponse extends BaseResponse {
    data: RoostrPriceData;
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface FarmlandPriceData {
    humble: number;
    big: number;
    vast: number;
    massive: number;
    infinite: number;
    _overall: number;
    timestamp: string;
}

export interface FarmlandPriceResponse extends BaseResponse {
    data: FarmlandPriceData;
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export interface BlueprintPriceData {
    common: number;
    rare: number;
    legendary: number;
    secret: number;
    _overall: number;
    timestamp: string;
}

export interface BlueprintPriceResponse extends BaseResponse {
    data: BlueprintPriceData;
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
} 