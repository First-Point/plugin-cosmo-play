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
import { BlueprintPriceResponse } from "../../types";

export interface GetBlueprintFloorsContent {}

function isGetBlueprintFloorsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetBlueprintFloorsContent {
    elizaLogger.debug("Content for get blueprint floors", content);
    return true; // No content needed for this action
}

const getBlueprintFloorsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting blueprint floors:
\`\`\`json
{}
\`\`\`

## Recent Messages

{{recentMessages}}

No additional information needed for this request.

Respond with an empty JSON markdown block.`;

export default {
    name: "GET_BLUEPRINT_FLOORS",
    similes: ["BLUEPRINT_FLOOR", "BLUEPRINT_PRICE", "CHECK_BLUEPRINT_FLOOR", "BLUEPRINT_RARITY_PRICE"],
    description:
        "MUST use this action if the user requests to view Blueprint floor prices.",
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
        elizaLogger.log("Starting GET_BLUEPRINT_FLOORS handler...");

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
                template: getBlueprintFloorsTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.debug("Get blueprint floors content:", content);

            if (!isGetBlueprintFloorsContent(runtime, content)) {
                elizaLogger.error("Invalid content for GET_BLUEPRINT_FLOORS action.");
                callback({
                    text: "Unable to process blueprint floors request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.getBlueprintPrices();
            elizaLogger.success("Successfully retrieved blueprint floors");

            if (!response.success) {
                callback({
                    text: "Failed to retrieve blueprint floors.",
                    content: { error: "API request failed" },
                });
                return false;
            }

            const { data } = response;
            const floorText = [
                'Blueprint Floor Prices:',
                `Overall Floor: ${data._overall} AVAX`,
                '',
                'By Rarity:',
                `Common: ${data.common} AVAX`,
                `Rare: ${data.rare} AVAX`,
                `Legendary: ${data.legendary} AVAX`,
                `Secret: ${data.secret} AVAX`
            ].join('\n');

            callback({
                text: floorText,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_BLUEPRINT_FLOORS handler:", error);
            callback({
                text: `Error getting blueprint floors: ${error.message}`,
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
                    text: "What are the blueprint floor prices?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_BLUEPRINT_FLOORS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me current blueprint prices",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_BLUEPRINT_FLOORS",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 