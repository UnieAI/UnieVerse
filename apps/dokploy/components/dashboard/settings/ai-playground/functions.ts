

export function copyImageLink(url: string) {
    navigator.clipboard.writeText(url)
        .then(() => {
            alert("Image link has been copied to the clipboard!");
        })
        .catch((err) => {
            console.error("Image link copy failed!", err);
        });
};

export function normalizeUrl(url: string) {
    const httpCheck = normalizeHttpUrl(url);
    const youtubeCheck = normalizeYouTubeUrl(httpCheck);
    return youtubeCheck;
};

export function normalizeHttpUrl(url: string) {
    return decodeURIComponent(url.startsWith('http:') ? url.replace('http:', 'https:') : url);
};

export function normalizeYouTubeUrl(url: string) {
    let _url = decodeURIComponent(url.startsWith('https://youtube.') ? url.replace('https://youtube.', 'https://www.youtube.') : url);
    _url = decodeURIComponent(_url.startsWith('https://m.youtube.') ? _url.replace('https://m.youtube.', 'https://www.youtube.') : _url);
    _url = decodeURIComponent(_url.startsWith('https://www.youtube.com/watch?app=desktop&v=') ? _url.replace('https://www.youtube.com/watch?app=desktop&v=', 'https://www.youtube.com/watch?v=') : _url);

    if (!url.startsWith('https://www.youtube.')) {
        _url = decodeURIComponent(url); // 將原始 URL 進行解碼
    }
    return _url;
};

export function calculateWaitTime(requestTime?: string, responseStartTime?: string): string {
    if (!requestTime || !responseStartTime) return "-";
    const waitMs = new Date(responseStartTime).getTime() - new Date(requestTime).getTime();
    return `${waitMs / 1000} sec`;
};


export function calculateCharsPerSecond(content: string, durationMs?: number): string {
    if (!durationMs || durationMs <= 0) return "-";
    const cps = (content.length / durationMs) * 1000; // 轉換成每秒
    return `${cps.toFixed(1)}`;
};

// ---  Search Params  --- //

import { ReadonlyURLSearchParams } from "next/navigation";
import { AI_PLAYGROUND_SEARCH_PARAMS } from ".";
import { AI_PLAYGROUND_TAB_VALUE } from "@/utils/unieai/unieinfra/key";

export function hasSearchParams(searchParams: ReadonlyURLSearchParams): boolean {
    const model = getModelFromUrl(searchParams);
    const tab = getTabFromUrl(searchParams);
    const api = getApiFromUrl(searchParams);
    const token = getTokenFromUrl(searchParams);

    // Log missing parameters explicitly by checking for empty strings
    if (model === "") {
        console.warn("Missing required URL parameter: model");
    } else {
        console.log(`Model: ${model}`);
    }

    if (tab === "") {
        console.warn("Missing required URL parameter: tab");
    } else {
        console.log(`Tab: ${tab}`);
    }

    if (api === "") {
        console.warn("Missing required URL parameter: api");
    } else {
        console.log(`API: ${api}`);
    }

    if (token === "") {
        console.warn("Missing required URL parameter: token");
    } else {
        console.log(`Token (sanitized): ${token}`);
    }

    const status = model !== "" && tab !== "" && api !== "" && token !== "";

    return status;
}

export function getModelFromUrl(searchParams: ReadonlyURLSearchParams): string {
    const model = searchParams.get(AI_PLAYGROUND_SEARCH_PARAMS.model) || "";
    return model;
}

export function getTabFromUrl(searchParams: ReadonlyURLSearchParams): string {
    const tab = searchParams.get(AI_PLAYGROUND_SEARCH_PARAMS.tab) || "";
    return tab;
}

export function getApiFromUrl(searchParams: ReadonlyURLSearchParams): string {
    const api = searchParams.get(AI_PLAYGROUND_SEARCH_PARAMS.api) || "";
    return api;
}

export function getTokenFromUrl(searchParams: ReadonlyURLSearchParams): string {
    const token = searchParams.get(AI_PLAYGROUND_SEARCH_PARAMS.token) || "";
    return token.startsWith("sk-") ? token.replace(/^sk-/, "") : token;
}
