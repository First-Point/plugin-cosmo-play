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

export interface GetRoostrFloorsContent {}

function isGetRoostrFloorsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetRoostrFloorsContent {
    elizaLogger.debug("Content for get roostr floors", content);
    return true; // No content needed for this action
}

const getRoostrFloorsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting roostr floors:
\`\`\`json
{}
\`\`\`

## Recent Messages

{{recentMessages}}

No additional information needed for this request.

Respond with an empty JSON markdown block.`;

export default {
    name: "GET_ROOSTR_FLOORS",
    similes: ["ROOSTR_FLOOR", "ROOSTR_PRICE", "CHECK_ROOSTR_FLOOR", "ROOSTR_RARITY_PRICE"],
    description:
        "MUST use this action if the user requests to view Roostr floor prices.",
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
        elizaLogger.log("Starting GET_ROOSTR_FLOORS handler...");

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
                template: getRoostrFloorsTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.debug("Get roostr floors content:", content);

            if (!isGetRoostrFloorsContent(runtime, content)) {
                elizaLogger.error("Invalid content for GET_ROOSTR_FLOORS action.");
                callback({
                    text: "Unable to process roostr floors request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.getRoostrPrices();
            elizaLogger.success("Successfully retrieved roostr floors");

            if (!response.success) {
                callback({
                    text: "Failed to retrieve roostr floors.",
                    content: { error: "API request failed" },
                });
                return false;
            }

            const { data } = response;
            const floorText = [
                'Roostr Floor Prices:',
                `Overall Floor: ${data._overall} ${data.currency}`,
                '',
                'By Rarity:',
                `Common: ${data.common} ${data.currency}`,
                `Nice: ${data.nice} ${data.currency}`,
                `Rare: ${data.rare} ${data.currency}`,
                `Elite: ${data.elite} ${data.currency}`,
                `Legendary: ${data.legendary} ${data.currency}`,
                `Unique: ${data.unique} ${data.currency}`
            ].join('\n');

            callback({
                text: floorText,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_ROOSTR_FLOORS handler:", error);
            callback({
                text: `Error getting roostr floors: ${error.message}`,
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
                    text: "What are the roostr floor prices?",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me current roostr prices",
                },
            }
        ],
    ] as ActionExample[][],
} as Action; 