import { Plugin } from "@elizaos/core";
import createWallet from "./actions/createWallet";
import getWalletDetails from "./actions/getWalletDetails";
import registerWallet from "./actions/registerWallet";
import { CosmoProvider } from "./provider/CosmoProvider";

// Configuration for the plugin
export const PROVIDER_CONFIG = {
    API_BASE_URL: process.env.COSMO_PLAY_API_BASE_URL,
    API_TOKEN: process.env.COSMO_PLAY_API_TOKEN,
    TIMEOUT: parseInt(process.env.COSMO_PLAY_TIMEOUT || '5000'),
    MAX_RETRIES: parseInt(process.env.COSMO_PLAY_MAX_RETRIES || '3')
};

// Provider instance
export const cosmoProvider = new CosmoProvider({
    apiBaseUrl: PROVIDER_CONFIG.API_BASE_URL || '',
    apiToken: PROVIDER_CONFIG.API_TOKEN || '',
    timeout: PROVIDER_CONFIG.TIMEOUT,
    maxRetries: PROVIDER_CONFIG.MAX_RETRIES
});

export const cosmoPlayPlugin: Plugin = {
    name: "cosmo-play",
    description: "Cosmo Play Plugin for Eliza - Wallet Management",
    actions: [createWallet, getWalletDetails, registerWallet],
    evaluators: [],
    providers: [cosmoProvider],
};

export default cosmoPlayPlugin; 