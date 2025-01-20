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

export interface RegisterWalletContent extends Content {
    privateKey: string;
}

function isRegisterWalletContent(
    runtime: IAgentRuntime,
    content: any
): content is RegisterWalletContent {
    elizaLogger.debug("Content for register wallet", content);
    return typeof content.privateKey === "string";
}

const registerWalletTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for wallet registration:
\`\`\`json
{
    "privateKey": "0xabc..."
}
\`\`\`

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the requested wallet registration:
- Private Key (required)

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "REGISTER_WALLET",
    similes: ["IMPORT_WALLET", "ADD_WALLET", "REGISTER_EXISTING_WALLET"],
    description:
        "MUST use this action if the user requests to register or import an existing wallet using a private key.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting REGISTER_WALLET handler...");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const context = composeContext({
            state,
            template: registerWalletTemplate,
        });

        const content = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.debug("Register wallet content:", content);

        if (!isRegisterWalletContent(runtime, content)) {
            elizaLogger.error("Invalid content for REGISTER_WALLET action.");
            callback?.({
                text: "Unable to process wallet registration request. Invalid content provided.",
                content: { error: "Invalid content" },
            });
            return false;
        }

        const response = await cosmoProvider.registerWallet(content.privateKey);

        callback?.({
            text: `Successfully registered wallet with address: ${response.wallet.address}`,
            content: response,
        });
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Register my wallet with private key 0xabc123",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "REGISTER_WALLET",
                    privateKey: "0xabc123",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Import wallet using key 0xdef456" },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "REGISTER_WALLET",
                    privateKey: "0xdef456",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 