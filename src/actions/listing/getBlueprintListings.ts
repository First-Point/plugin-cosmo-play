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

export interface GetBlueprintListingsContent {
    page?: number;
    limit?: number;
    sortDesc?: string;
    filter?: {
        rarity?: string;
        forSale?: boolean;
    };
}

function isGetBlueprintListingsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetBlueprintListingsContent {
    elizaLogger.debug("Content for get blueprint listings", content);
    return (
        (content.page === undefined || typeof content.page === "number") &&
        (content.limit === undefined || typeof content.limit === "number") &&
        (content.sortDesc === undefined || typeof content.sortDesc === "string") &&
        (content.filter === undefined || typeof content.filter === "object")
    );
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
            });

            elizaLogger.debug("Get blueprint listings content:", content);

            if (!isGetBlueprintListingsContent(runtime, content)) {
                elizaLogger.error("Invalid content for GET_BLUEPRINT_LISTINGS action.");
                callback({
                    text: "Unable to process blueprint listings request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.getListings('blueprint', {
                page: content.page,
                limit: content.limit,
                sortDesc: content.sortDesc,
                filter: {
                    ...(content.filter?.rarity && { rarity: content.filter.rarity }),
                    ...(content.filter?.forSale !== undefined && { forSale: content.filter.forSale })
                }
            }) as MarketListingsResponse<BlueprintListingItem>;
            elizaLogger.success("Successfully retrieved blueprint listings");

            const listingsText = response.data
                .map(listing => `${listing.name || 'Unnamed'} - ${listing.salePrice} AVAX - ${listing.rarity} - Owner: ${listing.owner}`)
                .join('\n');

            const filterInfo = [
                'Filters:',
                content.filter?.rarity ? `Rarity: ${content.filter.rarity}` : 'All Rarities',
                `Status: ${content.filter?.forSale ? 'For Sale Only' : 'All Listings'}`
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