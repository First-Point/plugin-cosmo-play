import { Plugin } from "@elizaos/core";
import actions from "./actions";

export const cosmoPlayPlugin: Plugin = {
    name: "cosmo-play",
    description: "Cosmo Play Plugin for Eliza - Wallet Management",
    actions: actions,
    evaluators: [],
};

export default cosmoPlayPlugin; 