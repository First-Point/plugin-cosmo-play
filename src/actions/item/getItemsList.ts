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
import { ItemListResponse } from "../../types";

export interface GetItemsListContent {
    page?: number;
    limit?: number;
    type?: 'equipables' | 'collectibles';
    rarity?: 'common' | 'rare' | 'legendary' | 'secret';
    forSale?: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 16;
const MAX_LIMIT = 100;

function isValidType(type: string): type is 'equipables' | 'collectibles' {
    return type === 'equipables' || type === 'collectibles';
}

function isValidRarity(rarity: string): rarity is 'common' | 'rare' | 'legendary' | 'secret' {
    return ['common', 'rare', 'legendary', 'secret'].indexOf(rarity) !== -1;
}

function isGetItemsListContent(
    runtime: IAgentRuntime,
    content: any
): content is GetItemsListContent {
    elizaLogger.debug("Content for get items list", content);

    // Validate page and limit
    if (content.page !== undefined && (typeof content.page !== "number" || content.page < 1)) {
        elizaLogger.error("Invalid page number");
        return false;
    }

    if (content.limit !== undefined && (typeof content.limit !== "number" || content.limit < 1 || content.limit > MAX_LIMIT)) {
        elizaLogger.error("Invalid limit");
        return false;
    }

    // Validate type
    if (content.type !== undefined && !isValidType(content.type)) {
        elizaLogger.error("Invalid item type");
        return false;
    }

    // Validate rarity
    if (content.rarity !== undefined && !isValidRarity(content.rarity)) {
        elizaLogger.error("Invalid rarity");
        return false;
    }

    // Validate forSale
    if (content.forSale !== undefined && typeof content.forSale !== "boolean") {
        elizaLogger.error("Invalid forSale value");
        return false;
    }

    return true;
}

const getItemsListTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response for getting items list:
\`\`\`json
{
    "page": 1,
    "limit": 16,
    "type": "equipables",
    "rarity": "common",
    "forSale": true
}
\`\`\`

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the items list request:
- Page Number (optional, default: 1, must be positive)
- Items per Page (optional, default: 16, max: 100)
- Item Type (optional: equipables, collectibles)
- Rarity (optional: common, rare, legendary, secret)
- For Sale Only (optional: true/false)

Note: If the user asks to "show more", increase the limit up to 100 or go to the next page.

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "GET_ITEMS_LIST",
    similes: ["LIST_ITEMS", "SHOW_ITEMS", "VIEW_ITEMS", "MORE_ITEMS", "NEXT_PAGE"],
    description:
        "MUST use this action if the user requests to view a list of items.",
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
        elizaLogger.log("Starting GET_ITEMS_LIST handler...");

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
                template: getItemsListTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.debug("Get items list content:", content);

            if (!isGetItemsListContent(runtime, content)) {
                elizaLogger.error("Invalid content for GET_ITEMS_LIST action.");
                callback({
                    text: "Unable to process items list request. Invalid content provided.",
                    content: { error: "Invalid content" },
                });
                return false;
            }

            // Apply defaults and constraints
            const requestContent = {
                page: content.page || DEFAULT_PAGE,
                limit: Math.min(content.limit || DEFAULT_LIMIT, MAX_LIMIT),
                type: content.type,
                rarity: content.rarity,
                forSale: content.forSale,
            };

            const response = await cosmoService.getItemsList(requestContent);
            elizaLogger.success("Successfully retrieved items list");

            if (!response.success) {
                callback({
                    text: "Failed to retrieve items list.",
                    content: { error: "API request failed" },
                });
                return false;
            }

            const itemsListText = response.data.items
                .map(item => {
                    const priceInfo = item.price ? ` - ${item.price} AVAX` : '';
                    const saleStatus = item.forSale ? ' (For Sale)' : '';
                    return `${item.name} (${item.type}, ${item.rarity})${priceInfo}${saleStatus}`;
                })
                .join('\n');

            const paginationInfo = `\nPage ${response.data.pagination.page} (Total items: ${response.data.pagination.total})`;
            const navigationHelp = response.data.pagination.page < Math.ceil(response.data.pagination.total / requestContent.limit) 
                ? "\nTo see more items, ask to go to the next page or increase the limit."
                : "";

            callback({
                text: `Items List:${itemsListText}\n${paginationInfo}${navigationHelp}`,
                content: response,
            });
            return true;
        } catch (error: any) {
            elizaLogger.error("Error in GET_ITEMS_LIST handler:", error);
            callback({
                text: `Error getting items list: ${error.message}`,
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
                    text: "Show me all common equipable items",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_ITEMS_LIST",
                    type: "equipables",
                    rarity: "common",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me more items",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_ITEMS_LIST",
                    page: 2,
                    limit: 50,
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "List legendary collectibles for sale",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "GET_ITEMS_LIST",
                    type: "collectibles",
                    rarity: "legendary",
                    forSale: true,
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 