import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const cosmoEnvSchema = z.object({
    API_BASE_URL: z.string().min(1, "API_BASE_URL is required"),
    API_TOKEN: z.string().min(1, "API_TOKEN is required")
});

export type CosmoConfig = z.infer<typeof cosmoEnvSchema>;

export async function validateCosmoConfig(
    runtime: IAgentRuntime
): Promise<CosmoConfig> {
    try {
        const config = {
            API_BASE_URL: runtime.getSetting("API_BASE_URL"),
            API_TOKEN: runtime.getSetting("API_TOKEN"),
        };
        return cosmoEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Cosmo API configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}