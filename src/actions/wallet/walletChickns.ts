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
import { WalletChiknsResponse } from "../../types";
import { z } from "zod";

export interface GetWalletChicknsContent {
    address: string;
}

const getWalletChicknsSchema = z.object({
    address: z.string().min(1)
});

const getWalletChicknsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting wallet chickns:
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
    name: "GET_WALLET_CHICKNS",
    similes: [
        "WALLET_CHIKN",
        "MY_CHIKN",
        "WALLET_CHICKEN",
        "CHECK_CHICKEN"
    ],
    description: "MUST use this action if the user requests to view their chikn NFTs.",
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
        elizaLogger.info("Starting GET_WALLET_CHICKNS handler...");

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
                template: getWalletChicknsTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: getWalletChicknsSchema
            }) as { object: GetWalletChicknsContent };

            const response = await cosmoService.getWalletNFTs<WalletChiknsResponse>(content.object.address, 'chikn');
            elizaLogger.info("Successfully retrieved wallet chickns");

            if (!response.success || !response.data) {
                callback({
                    text: "Failed to retrieve wallet chickns.",
                    content: { error: "Invalid response data" },
                });
                return false;
            }

            const { data } = response;
            const chiknText = data.data.length > 0 
                ? `Found ${data.totalCount} chikn NFTs:\n${data.data.map(chikn => 
                    `- Chikn #${chikn.token} (${chikn.rarity}) - KG: ${chikn.kg}, Rank: ${chikn.rank}`
                ).join('\n')}`
                : "No chikn NFTs found in this wallet.";

            callback({
                text: chiknText,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_WALLET_CHICKNS handler:", error);
            callback({
                text: `Error getting wallet chickns: ${error.message}`,
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
                    text: "Show me chikns in wallet 0x123abc",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "List chikn NFTs for 0x456def",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What chikns do I have in my wallet?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Display my chikn collection",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check chikns in 0x789ghi",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "View all my chikns",
                },
            }
        ],
    ] as ActionExample[][],
} as Action;
