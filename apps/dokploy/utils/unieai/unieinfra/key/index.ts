
// the key to get UnieInfra access_token value from localStorage 
export const ACCESS_TOKEN_KEY = "UnieInfraAccessToken";

export const UNIEINFRA_OPENAI_API_URL = `${process.env.NEXT_PUBLIC_UNIEINFRA_API_URL}/v1`;

export const UNIEINFRA_SYSTEM_API_URL = `${process.env.NEXT_PUBLIC_UNIEINFRA_API_URL}/api`;

export const API_TYPES = {
    AI: "AI",
    UNIEINFRA: "UnieInfra",
    OTHER: "Other",
    THIRD_PARTY:"ThirdParty",
}
export const API_VALUES: string[] = [API_TYPES.UNIEINFRA, API_TYPES.THIRD_PARTY, API_TYPES.OTHER];
export const TAB_VALUES: string[] = [API_TYPES.UNIEINFRA, API_TYPES.THIRD_PARTY];