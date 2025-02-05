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

export interface GetFarmlandListingsContent {
    page?: number;
    limit?: number;
    sortDesc?: string;
    filter?: {
        size?: string;
        forSale?: boolean;
    };
}

function isGetFarmlandListingsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetFarmlandListingsContent {
    elizaLogger.debug("Content for get farmland listings", content);
    return (
        (content.page === undefined || typeof content.page === "number") &&
        (content.limit === undefined || typeof content.limit === "number") &&
        (content.sortDesc === undefined || typeof content.sortDesc === "string") &&
        (content.filter === undefined || typeof content.filter === "object")
    );
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
            });

            elizaLogger.debug("Get farmland listings content:", content);

            if (!isGetFarmlandListingsContent(runtime, content)) {
                elizaLogger.error("Invalid content for GET_FARMLAND_LISTINGS action.");
                callback({
                    text: "Unable to process farmland listings request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.getListings('farmland', {
                page: content.page,
                limit: content.limit,
                sortDesc: content.sortDesc,
                filter: {
                    ...(content.filter?.forSale !== undefined && { forSale: content.filter.forSale })
                }
            }) as MarketListingsResponse<FarmlandListingItem>;
            elizaLogger.success("Successfully retrieved farmland listings");

            const listingsText = response.data
                .map(listing => [
                    `#${listing.token} - ${listing.name || 'Unnamed'}`,
                    `Price: ${listing.salePrice} AVAX`,
                    `Rarity: ${listing.rarity}`,
                    `Size: ${listing.size} (${listing.bigness})`,
                    `Worm in Land: ${listing.wormInLand.toLocaleString()}`,
                    `Owner: ${listing.owner}`
                ].join(' | '))
                .join('\n');

            const filterInfo = [
                'Filters:',
                `Status: ${content.filter?.forSale ? 'For Sale Only' : 'All Listings'}`
            ].join('\n');

            callback({
                text: `Farmland Listings:\n${filterInfo}\n\n${listingsText}`,
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