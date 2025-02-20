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
import { WalletFarmlandResponse } from "../../types";

export interface GetWalletFarmlandContent {
    address: string;
}

const getWalletFarmlandSchema = z.object({
    address: z.string().min(1)
});

const getWalletFarmlandTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting wallet farmland:
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
    name: "GET_WALLET_FARMLAND",
    similes: [
        "WALLET_FARMLAND",
        "CHECK_FARMLAND",
        "GET_FARMLAND",
        "MY_FARMLAND",
        "WALLET_LAND"
    ],
    description: "MUST use this action if the user requests to view their farmland NFTs.",
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
        elizaLogger.info("Starting GET_WALLET_FARMLAND handler...");

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
                template: getWalletFarmlandTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: getWalletFarmlandSchema
            }) as { object: GetWalletFarmlandContent };

            const response = await cosmoService.getWalletNFTs<WalletFarmlandResponse>(content.object.address, 'farmland');
            elizaLogger.info("Successfully retrieved wallet farmland");

            if (!response.success || !response.data) {
                callback({
                    text: "Failed to retrieve wallet farmland.",
                    content: { error: "Invalid response data" },
                });
                return false;
            }

            const { data } = response;
            const farmlandText = data.data.length > 0 
                ? `Found ${data.totalCount} farmland NFTs:\n${data.data.map(nft => 
                    `- ${nft.name} (${nft.size})`
                ).join('\n')}`
                : "No farmland NFTs found in this wallet.";

            callback({
                text: farmlandText,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_WALLET_FARMLAND handler:", error);
            callback({
                text: `Error getting wallet farmland: ${error.message}`,
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
                    text: "Show me farmland in wallet 0x123abc",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "List farmland NFTs for 0x456def",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What farmlands do I have in my wallet?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Display my farmland collection",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check farmlands in 0x789ghi",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "View all my farmlands",
                },
            }
        ],
    ] as ActionExample[][],
} as Action;
