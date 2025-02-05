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
import { ListingsResponse, RoostrListingItem } from "../../types";

export interface GetRoostrListingsContent {
    page?: number;
    limit?: number;
    sortDesc?: string;
    filter?: {
        rarity?: string;
        forSale?: boolean;
    };
}

function isGetRoostrListingsContent(
    runtime: IAgentRuntime,
    content: any
): content is GetRoostrListingsContent {
    elizaLogger.debug("Content for get roostr listings", content);
    return (
        (content.page === undefined || typeof content.page === "number") &&
        (content.limit === undefined || typeof content.limit === "number") &&
        (content.sortDesc === undefined || typeof content.sortDesc === "string") &&
        (content.filter === undefined || typeof content.filter === "object")
    );
}

const getRoostrListingsTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting roostr listings:
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

Given the recent messages, extract the following information about the roostr listings request:
- Page Number (optional, default: 1)
- Items per Page (optional, default: 16)
- Sort Field (optional: price, date)
- Filter Conditions (optional):
  - Rarity (optional: common, nice, rare,elite, legendary, unique)
  - For Sale Only (optional)

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "GET_ROOSTR_LISTINGS",
    similes: ["ROOSTR_MARKET", "ROOSTR_LISTINGS", "ROOSTR_FOR_SALE"],
    description:
        "MUST use this action if the user requests to view Roostr market listings.",
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
        elizaLogger.log("Starting GET_ROOSTR_LISTINGS handler...");

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
                template: getRoostrListingsTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.debug("Get roostr listings content:", content);

            if (!isGetRoostrListingsContent(runtime, content)) {
                elizaLogger.error("Invalid content for GET_ROOSTR_LISTINGS action.");
                callback?.({
                    text: "Unable to process roostr listings request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            const response = await cosmoService.getListings('roostr', {
                page: content.page,
                limit: content.limit,
                sortDesc: content.sortDesc,
                filter: {
                    ...(content.filter?.rarity && { rarity: content.filter.rarity }),
                    ...(content.filter?.forSale !== undefined && { forSale: content.filter.forSale })
                }
            }) as ListingsResponse<RoostrListingItem>;
            elizaLogger.success("Successfully retrieved roostr listings");

            const listingsText = response.data
                .map(listing => `#${listing.token} - ${listing.name || 'Unnamed'} - ${listing.salePrice} AVAX - ${listing.rarity} - Owner: ${listing.owner}`)
                .join('\n');

            const filterInfo = [
                'Filters:',
                content.filter?.rarity ? `Rarity: ${content.filter.rarity}` : 'All Rarities',
                `Status: ${content.filter?.forSale ? 'For Sale Only' : 'All Listings'}`
            ].join('\n');

            callback?.({
                text: `Roostr Listings:\n${filterInfo}\n\n${listingsText}`,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_ROOSTR_LISTINGS handler:", error);
            callback?.({
                text: `Error getting roostr listings: ${error.message}`,
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
                    text: "Show me roostr listings",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_ROOSTR_LISTINGS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "List common roostrs for sale sorted by price",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_ROOSTR_LISTINGS",
                    sortDesc: "price",
                    filter: {
                        rarity: "common",
                        forSale: true,
                    },
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 