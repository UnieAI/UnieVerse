import { useEffect, useState } from "react";

const TOKEN_KEY = process.env.NEXT_PUBLIC_UNIEINFRA_ACCESS_TOKEN_KEY!;

export const useUnieInfraToken = () => {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    // 初始化：讀取 localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        setAccessToken(storedToken);
    }, []);

    const updateAccessToken = (newToken: string | null) => {
        if (newToken) {
            localStorage.setItem(TOKEN_KEY, newToken);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
        setAccessToken(newToken);
    };

    return { accessToken, updateAccessToken };
};