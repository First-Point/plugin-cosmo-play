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
import { validateCosmoConfig } from "../environment";
import { createCosmoService } from "../service/CosmoService";

export interface CreateWalletContent {
    walletType?: string;
}

function isCreateWalletContent(
    runtime: IAgentRuntime,
    content: any
): content is CreateWalletContent {
    elizaLogger.debug("Content for create wallet", content);
    return content.walletType === undefined || typeof content.walletType === "string";
}

const createWalletTemplate = `Respond with a JSON markdown block containing only the extracted values.

If the user did not provide enough details, respond with what you can.

Example response for a new wallet:
\`\`\`json
{
    "walletType": "standard"
}
\`\`\`

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the requested wallet creation:
- Wallet Type (optional)

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "CREATE_WALLET",
    similes: ["NEW_WALLET", "GENERATE_WALLET", "CREATE_NEW_WALLET"],
    description:
        "MUST use this action if the user requests to create a new wallet.",
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
        elizaLogger.log("Starting CREATE_WALLET handler...");

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
                template: createWalletTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.debug("Create wallet content:", content);

            if (!isCreateWalletContent(runtime, content)) {
                elizaLogger.error("Invalid content for CREATE_WALLET action.");
                callback?.({
                    text: "Unable to process wallet creation request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.createWallet();
            elizaLogger.success("Successfully created wallet");
            callback?.({
                text: `Created new wallet with address: ${response.wallet.address}`,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in CREATE_WALLET handler:", error);
            callback?.({
                text: `Error creating wallet: ${error.message}`,
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
                    text: "Create a new wallet",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "CREATE_WALLET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Generate a standard wallet for me" },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "CREATE_WALLET",
                    walletType: "standard",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 