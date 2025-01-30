import { Plugin } from "@elizaos/core";
import createWallet from "./actions/createWallet";
import getWalletDetails from "./actions/getWalletDetails";
import registerWallet from "./actions/registerWallet";

export const cosmoPlayPlugin: Plugin = {
    name: "cosmo-play",
    description: "Cosmo Play Plugin for Eliza - Wallet Management",
    actions: [createWallet, getWalletDetails, registerWallet],
    evaluators: [],
};

export default cosmoPlayPlugin; 