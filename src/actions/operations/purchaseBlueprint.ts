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
    name: "PURCHASE_BLUEPRINT",
    similes: [
        "BUY_BLUEPRINT",
        "PURCHASE_BLUEPRINT",
        "GET_BLUEPRINT",
        "ACQUIRE_BLUEPRINT",
        "WANT_BLUEPRINT",
        "NEED_BLUEPRINT"
    ],
    description: "MUST use this action if the user wants to purchase a blueprint.",
    validate: async () => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        callback({
            text: "To purchase a blueprint, please press the button below.",
            content: { 
                dataType: "transaction",
                requestType: "POST",
                data: {
                    url: "{servicerunner_url}/chikn/wallet/blueprint/purchase",
                    payload: {
                        rarity: "common",
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
                    text: "I want to buy a blueprint",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How do I purchase a blueprint?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you help me get a blueprint?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I need to acquire a blueprint",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Where can I buy blueprints?",
                },
            }
        ],
    ] as ActionExample[][],
} as Action; 