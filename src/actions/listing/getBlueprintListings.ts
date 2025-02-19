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
import { MarketListingsResponse, BlueprintListingItem } from "../../types";
import { z } from "zod";

export interface GetBlueprintListingsContent {
    page?: number;
    limit?: number;
    sortDesc?: string;
    filter?: {
        rarity?: string;
        forSale?: boolean;
    };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 16;
const MAX_LIMIT = 100;

const getBlueprintListingsSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(MAX_LIMIT).optional(),
    sortDesc: z.enum(['price', 'date']).optional(),
    filter: z.object({
        rarity: z.enum(['common', 'rare', 'legendary', 'secret']).optional(),
        forSale: z.boolean().optional()
    }).optional()
});

function isGetBlueprintListingsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetBlueprintListingsContent {
    elizaLogger.debug("Content for get blueprint listings", content);
    try {
        getBlueprintListingsSchema.parse(content);
        return true;
    } catch (error) {
        elizaLogger.error("Invalid blueprint listings content:", error);
        return false;
    }
}

const getBlueprintListingsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting blueprint listings:
\`\`\`json
{
    "page": 1,
    "limit": 16,
    "sortDesc": "price",
    "filter": {
        "rarity": "common",
        "forSale": true
    }
}
\`\`\`

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the blueprint listings request:
- Page Number (optional, default: 1)
- Items per Page (optional, default: 16)
- Sort Field (optional: price, date)
- Filter Conditions (optional):
  - Rarity (optional: common, rare, legendary, secret)
  - For Sale Only (optional)

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "GET_BLUEPRINT_LISTINGS",
    similes: [
        "BLUEPRINT_MARKET",
        "BLUEPRINT_LISTINGS",
        "BLUEPRINT_FOR_SALE",
        "SHOW_BLUEPRINT",
        "LIST_BLUEPRINT",
        "FIND_BLUEPRINT",
        "BLUEPRINT_LIST",
        "BLUEPRINT_SALES",
        "BLUEPRINT_MARKETPLACE",
        "VIEW_BLUEPRINT",
        "CHECK_BLUEPRINT",
        "SEARCH_BLUEPRINT"
    ],
    description:
        "MUST use this action if the user requests to view Blueprint market listings.",
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
        elizaLogger.log("Starting GET_BLUEPRINT_LISTINGS handler...");

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
                template: getBlueprintListingsTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: getBlueprintListingsSchema
            }) as { object: GetBlueprintListingsContent };

            // Apply defaults
            const requestContent = {
                page: content.object?.page || DEFAULT_PAGE,
                limit: Math.min(content.object?.limit || DEFAULT_LIMIT, MAX_LIMIT),
                sortDesc: content.object?.sortDesc,
                filter: content.object?.filter
            };

            elizaLogger.debug("Get blueprint listings content:", requestContent);

            if (!isGetBlueprintListingsContent(runtime, requestContent)) {
                elizaLogger.error("Invalid content for GET_BLUEPRINT_LISTINGS action.");
                callback({
                    text: "Unable to process blueprint listings request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.getListings('blueprint', {
                page: requestContent.page,
                limit: requestContent.limit,
                sortDesc: requestContent.sortDesc,
                filter: {
                    ...(requestContent.filter?.rarity && { rarity: requestContent.filter.rarity }),
                    ...(requestContent.filter?.forSale !== undefined && { forSale: requestContent.filter.forSale })
                }
            }) as MarketListingsResponse<BlueprintListingItem>;
            elizaLogger.success("Successfully retrieved blueprint listings");

            const listingsText = response.data
                .map(listing => `${listing.name || 'Unnamed'} - ${listing.salePrice} AVAX - ${listing.rarity} - Owner: ${listing.owner}`)
                .join('\n');

            const filterInfo = [
                'Filters:',
                requestContent.filter?.rarity ? `Rarity: ${requestContent.filter.rarity}` : 'All Rarities',
                `Status: ${requestContent.filter?.forSale ? 'For Sale Only' : 'All Listings'}`
            ].join('\n');

            callback({
                text: `Blueprint Listings:\n${filterInfo}\n\n${listingsText}`,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_BLUEPRINT_LISTINGS handler:", error);
            callback({
                text: `Error getting blueprint listings: ${error.message}`,
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
                    text: "Show me blueprint listings",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "List common blueprints for sale sorted by price",
                },
            }
        ],
    ] as ActionExample[][],
} as Action; 