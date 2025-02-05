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
import { FarmlandPriceResponse } from "../../types";

export interface GetFarmlandFloorsContent {}

function isGetFarmlandFloorsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetFarmlandFloorsContent {
    elizaLogger.debug("Content for get farmland floors", content);
    return true; // No content needed for this action
}

const getFarmlandFloorsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting farmland floors:
\`\`\`json
{}
\`\`\`

## Recent Messages

{{recentMessages}}

No additional information needed for this request.

Respond with an empty JSON markdown block.`;

export default {
    name: "GET_FARMLAND_FLOORS",
    similes: ["FARMLAND_FLOOR", "FARMLAND_PRICE", "CHECK_FARMLAND_FLOOR", "FARMLAND_SIZE_PRICE"],
    description:
        "MUST use this action if the user requests to view Farmland floor prices.",
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
        elizaLogger.log("Starting GET_FARMLAND_FLOORS handler...");

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
                template: getFarmlandFloorsTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.debug("Get farmland floors content:", content);

            if (!isGetFarmlandFloorsContent(runtime, content)) {
                elizaLogger.error("Invalid content for GET_FARMLAND_FLOORS action.");
                callback({
                    text: "Unable to process farmland floors request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.getFarmlandPrices();
            elizaLogger.success("Successfully retrieved farmland floors");

            if (!response.success) {
                callback({
                    text: "Failed to retrieve farmland floors.",
                    content: { error: "API request failed" },
                });
                return false;
            }

            const { data } = response;
            const floorText = [
                'Farmland Floor Prices:',
                `Overall Floor: ${data._overall} AVAX`,
                '',
                'By Size:',
                `Humble: ${data.humble} AVAX`,
                `Big: ${data.big} AVAX`,
                `Vast: ${data.vast} AVAX`,
                `Massive: ${data.massive} AVAX`,
                `Infinite: ${data.infinite} AVAX`
            ].join('\n');

            callback({
                text: floorText,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_FARMLAND_FLOORS handler:", error);
            callback({
                text: `Error getting farmland floors: ${error.message}`,
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
                    text: "What are the farmland floor prices?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_FARMLAND_FLOORS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me current farmland prices",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_FARMLAND_FLOORS",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 