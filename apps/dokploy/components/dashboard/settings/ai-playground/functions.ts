

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
