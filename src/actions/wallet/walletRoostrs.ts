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

export interface GetWalletRoostrsContent {
    address: string;
}

const getWalletRoostrsSchema = z.object({
    address: z.string().min(1)
});

const getWalletRoostrsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting wallet roostr:
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
    name: "GET_WALLET_ROOSTRS",
    similes: [
        "WALLET_ROOSTR",
        "GET_ROOSTR",
        "MY_ROOSTR",
        "WALLET_ROOSTER",
        "CHECK_ROOSTER"
    ],
    description: "MUST use this action if the user requests to view their roostr NFTs.",
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
        elizaLogger.info("Starting GET_WALLET_ROOSTRS handler...");

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
                template: getWalletRoostrsTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: getWalletRoostrsSchema
            }) as { object: GetWalletRoostrsContent };

            const response = await cosmoService.getWalletNFTs(content.object.address, 'roostr');
            elizaLogger.info("Successfully retrieved wallet roostrs");

            if (!response.success || !response.data) {
                callback({
                    text: "Failed to retrieve wallet roostrs.",
                    content: { error: "Invalid response data" },
                });
                return false;
            }

            const { data } = response;
            const roostrText = data.data.length > 0 
                ? `Found ${data.totalCount} roostr NFTs:\n${data.data.map(roostr => 
                    `- Roostr #${roostr.token} (${roostr.rarity}) - KG: ${roostr.kg}, Rank: ${roostr.rank}`
                ).join('\n')}`
                : "No roostr NFTs found in this wallet.";

            callback({
                text: roostrText,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_WALLET_ROOSTRS handler:", error);
            callback({
                text: `Error getting wallet roostrs: ${error.message}`,
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
                    text: "Show me roostr in wallet 0x123abc",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "List roostr NFTs for 0x456def",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What roostrs do I have in my wallet?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Display my roostr collection",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check roostrs in 0x789ghi",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "View all my roostrs",
                },
            }
        ],
    ] as ActionExample[][],
} as Action;
