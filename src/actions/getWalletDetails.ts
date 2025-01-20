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
    Content,
} from "@elizaos/core";
import { cosmoProvider } from "../index";

export interface GetWalletDetailsContent extends Content {
    address: string;
}

function isGetWalletDetailsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetWalletDetailsContent {
    elizaLogger.debug("Content for get wallet details", content);
    return typeof content.address === "string";
}

const getWalletDetailsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for wallet details:
\`\`\`json
{
    "address": "0x123..."
}
\`\`\`

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the requested wallet details:
- Wallet Address (required)

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "GET_WALLET_DETAILS",
    similes: ["WALLET_INFO", "CHECK_WALLET", "VIEW_WALLET"],
    description:
        "MUST use this action if the user requests to view wallet details or information.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting GET_WALLET_DETAILS handler...");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const context = composeContext({
            state,
            template: getWalletDetailsTemplate,
        });

        const content = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.debug("Get wallet details content:", content);

        if (!isGetWalletDetailsContent(runtime, content)) {
            elizaLogger.error("Invalid content for GET_WALLET_DETAILS action.");
            callback?.({
                text: "Unable to process wallet details request. Invalid content provided.",
                content: { error: "Invalid content" },
            });
            return false;
        }

        const response = await cosmoProvider.getWalletDetails(content.address);

        callback?.({
            text: `Wallet Details for ${content.address}:\nBalance: ${response.wallet.balance}\nPublic Key: ${response.wallet.publicKey}`,
            content: response,
        });
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me the details for wallet 0x123abc",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_WALLET_DETAILS",
                    address: "0x123abc",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "What's the balance of 0x456def?" },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_WALLET_DETAILS",
                    address: "0x456def",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 