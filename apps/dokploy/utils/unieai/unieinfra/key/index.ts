
export const isDevelopment: boolean = (process.env.NODE_ENV === "development");

// the key to get UnieInfra access_token value from localStorage 
export const ACCESS_TOKEN_KEY = "UnieInfraAccessToken";

export const UNIEINFRA_OPENAI_API_URL = `${process.env.NEXT_PUBLIC_UNIEINFRA_API_URL}/v1`;

export const UNIEINFRA_SYSTEM_API_URL = `${process.env.NEXT_PUBLIC_UNIEINFRA_API_URL}/api`;

export const defaultTokenName = "default";

// ai-playground tab
export const AI_PLAYGROUND_TAB_VALUE = {
    AI: "AI",
    UNIEINFRA: "UnieInfra",
    THIRD_PARTY: "Third-Party",
    TEST_API: "Test API",
}
export const AI_PLAYGROUND_TAB_KEYS: string[] = [AI_PLAYGROUND_TAB_VALUE.UNIEINFRA, AI_PLAYGROUND_TAB_VALUE.THIRD_PARTY, AI_PLAYGROUND_TAB_VALUE.TEST_API];

// ai settings
export const AI_MODEL_SOURCE_VALUE = {
    UNIEINFRA: "By UnieInfra",
    THIRD_PARTY: "By Third-Party",
    OTHER_API: "By other api",
}
export const AI_MODEL_SOURCE_KEYS: string[] =
    (isDevelopment)
        ? [AI_MODEL_SOURCE_VALUE.UNIEINFRA, AI_MODEL_SOURCE_VALUE.THIRD_PARTY, AI_MODEL_SOURCE_VALUE.OTHER_API]
        : [AI_MODEL_SOURCE_VALUE.UNIEINFRA, AI_MODEL_SOURCE_VALUE.THIRD_PARTY];

// ai-api settings tab
export const AI_API_TAB_VALUE = {
    UNIEINFRA: "UnieInfra",
    THIRD_PARTY: "Third-Party",
}
export const AI_API_TAB_KEYS: string[] = [AI_API_TAB_VALUE.UNIEINFRA, AI_API_TAB_VALUE.THIRD_PARTY];

