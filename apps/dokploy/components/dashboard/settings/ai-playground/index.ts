

export interface Message {
    role: "system" | "user" | "assistant";
    content: string;

    loading?: boolean;             // 前端UI...動畫

    requestTime?: string;          // ISO 格式時間，例如 "2025-05-12T09:38:01.123Z"
    responseStartTime?: string;    // 回應開始時間
    responseEndTime?: string;      // 回應完成時間
    durationMs?: number;           // 毫秒耗時（responseTime - requestTime）

    state?: "pending" | "streaming" | "complete" | "error" | "abort";
};

export interface ModelData {
    created: number
    id: string
    object: string
    owned_by: string
};

export interface ModelParams {
    temperature: number
    max_tokens: number
    top_p: number
    top_k: number
    presence_penalty: number
    frequency_penalty: number
    system_prompt: string
    context_length_exceeded_behavior: string
    echo: boolean
};

export const _defaultModelParams: ModelParams = {
    temperature: 0.6,
    max_tokens: 4096,
    top_p: 1,
    top_k: 40,
    presence_penalty: 0,
    frequency_penalty: 0,
    system_prompt: "",
    context_length_exceeded_behavior: "none",
    echo: false
};

// --- Search Params --- //

// ai-playground search params
export const AI_PLAYGROUND_SEARCH_PARAMS = {
    model: "model",
    tab: "tab",
    api: "api",
    token: "token"
}
