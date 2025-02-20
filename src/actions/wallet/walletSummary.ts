import {
    Action,
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass,
} from "@elizaos/core";
import { validateCosmoConfig } from "../../environment";
import { createCosmoService } from "../../service/CosmoService";
import { z } from "zod";

export interface GetWalletSummaryContent {
    address: string;
}

const getWalletSummarySchema = z.object({
    address: z.string().min(1)
});

const getWalletSummaryTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting wallet summary:
\`\`\`json
{
    "success": true,
    "data": {}
}
\`\`\`

## Recent Messages

{{recentMessages}}

Extract the Ethereum wallet address from the recent messages. The address should start with "0x".
If no address is found, respond with an error message.
Respond with a JSON markdown block containing only the wallet address.`;

export default {
    name: "GET_WALLET_SUMMARY",
    similes: [
        "WALLET_SUMMARY", 
        "CHECK_WALLET", 
        "VIEW_WALLET", 
        "SHOW_WALLET",
        "CHIKN_WALLET",
        "CHICKN_WALLET",
        "GET_CHIKN_WALLET",
        "GET_CHICKN_WALLET",
        "CHIKN_SUMMARY",
        "CHICKN_SUMMARY"
    ],
    description: "MUST use this action if the user requests to view a wallet summary.",
    validate: async (runtime: IAgentRuntime) => {
        try {
            await validateCosmoConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("Validation failed:", error);
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.info("Starting GET_WALLET_SUMMARY handler...");

        try {
            const config = await validateCosmoConfig(runtime);
            const cosmoService = createCosmoService(config);

            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const context = composeContext({
                state,
                template: getWalletSummaryTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: getWalletSummarySchema
            }) as { object: GetWalletSummaryContent };

            const response = await cosmoService.getWalletSummary(content.object.address);
            elizaLogger.info("Successfully retrieved wallet summary");

            if (!response.success || !response.data) {
                callback({
                    text: "Failed to retrieve wallet summary.",
                    content: { error: "Invalid response data" },
                });
                return false;
            }

            const { data } = response;
            const summaryText = [
                'Wallet Summary:',
                `Address: ${data.address}`,
                `Balance: ${data.balance} AVAX`,
                '',
                'NFTs:',
                `Chikns: ${data.nfts.chikns}`,
                `Roostrs: ${data.nfts.roostrs}`,
                `Farmlands: ${data.nfts.farmlands}`,
                `Blueprints: ${data.nfts.blueprints}`,
                `Items: ${data.nfts.items}`,
                `Drips: ${data.nfts.drips}`,
                '',
                'Stats:',
                `Total Value: ${data.stats.totalValue} AVAX`,
                `Average KG: ${data.stats.avgKg}`,
                `Average Level: ${data.stats.avgLevel}`
            ].join('\n');

            callback({
                text: summaryText,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_WALLET_SUMMARY handler:", error);
            callback({
                text: `Error getting wallet summary: ${error.message}`,
                content: { error: error.message },
            });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me wallet 0x123abc summary",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get summary for wallet 0x456def",
                },
            }
        ],
    ] as ActionExample[][],
} as Action;
