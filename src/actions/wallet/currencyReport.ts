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
import { validateCosmoConfig } from "../../environment";
import { createCosmoService } from "../../service/CosmoService";

interface CurrencyReportResponse {
    success: boolean;
    data: {
        quotes: {
            AVAX: { quote: number; direction: string; };
            EGG: { quote: number; direction: string; };
            FEED: { quote: number; direction: string; };
            FERT: { quote: number; direction: string; };
            WORM: { quote: number; direction: string; };
        };
    };
    metadata: {
        timestamp: string;
        network: string;
        source: string;
    };
}

export default {
    name: "GET_CURRENCY_REPORT",
    similes: [
        "CURRENCY_REPORT",
        "TOKEN_PRICES",
        "CHECK_PRICES",
        "PRICE_CHECK",
        "TOKEN_VALUES",
        "CURRENCY_PRICES",
        "CHECK_TOKENS",
        "GET_PRICES",
        "SHOW_PRICES"
    ],
    description: "MUST use this action if the user requests to view token prices or currency report.",
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
        elizaLogger.info("Starting GET_CURRENCY_REPORT handler...");

        try {
            const config = await validateCosmoConfig(runtime);
            const cosmoService = createCosmoService(config);

            const response = await cosmoService.getCurrencyReport();
            
            elizaLogger.info("Successfully retrieved currency report");

            if (!response.success || !response.data) {
                callback({
                    text: "Failed to retrieve currency report.",
                    content: { error: "Invalid response data" },
                });
                return false;
            }

            const { quotes } = response.data;
            const priceText = [
                'Current Token Prices:',
                `AVAX: $${quotes.AVAX.quote.toFixed(2)} (${quotes.AVAX.direction})`,
                `EGG: $${quotes.EGG.quote.toFixed(6)} (${quotes.EGG.direction})`,
                `FEED: $${quotes.FEED.quote.toFixed(6)} (${quotes.FEED.direction})`,
                `FERT: $${quotes.FERT.quote.toFixed(6)} (${quotes.FERT.direction})`,
                `WORM: $${quotes.WORM.quote.toFixed(6)} (${quotes.WORM.direction})`
            ].join('\n');

            callback({
                text: priceText,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_CURRENCY_REPORT handler:", error);
            callback({
                text: `Error getting currency report: ${error.message}`,
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
                    text: "Show me token prices",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are the current prices?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the price of EGG?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check AVAX price",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How much is FEED worth?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get currency report",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the current value of FERT and WORM?",
                },
            }
        ],
    ] as ActionExample[][],
} as Action;
