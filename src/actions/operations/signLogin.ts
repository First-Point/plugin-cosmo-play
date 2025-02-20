import {
    Action,
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    composeContext,
} from "@elizaos/core";

export default {
    name: "SIGN_LOGIN",
    similes: [
        "LOGIN",
        "SIGN_IN",
        "CONNECT_WALLET",
        "AUTHENTICATE",
        "CONNECT",
        "LINK_WALLET"
    ],
    description: "MUST use this action if the user wants to login or connect their wallet.",
    validate: async () => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        callback({
            text: "To connect your wallet, please press the button below.",
            content: { 
                dataType: "sign",
                requestType: "POST",
                data: {
                    url: "{servicerunner_url}/chikn/coqfight/sendWallet",
                    payload: {
                        "wallet": "{user_wallet}"
                    }
                }
            },
        });
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to login",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Connect my wallet",
                },
            }
        ],
    ] as ActionExample[][],
} as Action;
