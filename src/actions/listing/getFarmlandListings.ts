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
import { MarketListingsResponse, FarmlandListingItem } from "../../types";
import { z } from "zod";

export interface GetFarmlandListingsContent {
    page?: number;
    limit?: number;
    sortDesc?: string;
    filter?: {
        size?: string;
        forSale?: boolean;
    };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 16;
const MAX_LIMIT = 100;

const getFarmlandListingsSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(MAX_LIMIT).optional(),
    sortDesc: z.enum(['price', 'date']).optional(),
    filter: z.object({
        size: z.enum(['humble', 'big', 'vast', 'massive', 'infinite']).optional(),
        forSale: z.boolean().optional()
    }).optional()
});

function isGetFarmlandListingsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetFarmlandListingsContent {
    elizaLogger.debug("Content for get farmland listings", content);
    try {
        getFarmlandListingsSchema.parse(content);
        return true;
    } catch (error) {
        elizaLogger.error("Invalid farmland listings content:", error);
        return false;
    }
}

const getFarmlandListingsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting farmland listings:
\`\`\`json
{
    "page": 1,
    "limit": 16,
    "sortDesc": "price",
    "filter": {
        "size": "small",
        "forSale": true
    }
}
\`\`\`

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the farmland listings request:
- Page Number (optional, default: 1)
- Items per Page (optional, default: 16)
- Sort Field (optional: price, date)
- Filter Conditions (optional):
  - For Sale Only (optional)

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "GET_FARMLAND_LISTINGS",
    similes: [
        "FARMLAND_MARKET",
        "FARMLAND_LISTINGS",
        "FARMLAND_FOR_SALE",
        "SHOW_FARMLAND",
        "LIST_FARMLAND",
        "FIND_FARMLAND",
        "FARMLAND_LIST",
        "FARMLAND_SALES",
        "FARMLAND_MARKETPLACE",
        "VIEW_FARMLAND",
        "CHECK_FARMLAND",
        "SEARCH_FARMLAND",
        "LAND_MARKET",
        "LAND_LIST",
        "LAND_FOR_SALE"
    ],
    description:
        "MUST use this action if the user requests to view Farmland market listings.",
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
        elizaLogger.log("Starting GET_FARMLAND_LISTINGS handler...");

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
                template: getFarmlandListingsTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: getFarmlandListingsSchema
            }) as { object: GetFarmlandListingsContent };

            // Apply defaults
            const requestContent = {
                page: content.object?.page || DEFAULT_PAGE,
                limit: Math.min(content.object?.limit || DEFAULT_LIMIT, MAX_LIMIT),
                sortDesc: content.object?.sortDesc,
                filter: content.object?.filter
            };

            elizaLogger.debug("Get farmland listings content:", requestContent);

            if (!isGetFarmlandListingsContent(runtime, requestContent)) {
                elizaLogger.error("Invalid content for GET_FARMLAND_LISTINGS action.");
                callback({
                    text: "Unable to process farmland listings request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.getListings('farmland', {
                page: requestContent.page,
                limit: requestContent.limit,
                sortDesc: requestContent.sortDesc,
                filter: {
                    ...(requestContent.filter?.forSale !== undefined && { forSale: requestContent.filter.forSale })
                }
            }) as MarketListingsResponse<FarmlandListingItem>;
            elizaLogger.success("Successfully retrieved farmland listings");

            const filterInfo = [
                'Filters:',
                `Status: ${requestContent.filter?.forSale ? 'For Sale Only' : 'All Listings'}`
            ].join('\n');

            callback({
                text: `Farmland Listings:\n${filterInfo}`,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_FARMLAND_LISTINGS handler:", error);
            callback({
                text: `Error getting farmland listings: ${error.message}`,
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
                    text: "Show me farmland listings",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "List big farmlands for sale sorted by price",
                },
            }
        ],
    ] as ActionExample[][],
} as Action; 