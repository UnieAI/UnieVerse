import { useEffect, useState } from "react";
import { LoginUnieInfra, LoginUnieInfraError } from "./LoginUnieInfra";

const TOKEN_KEY = process.env.NEXT_PUBLIC_UNIEINFRA_ACCESS_TOKEN_KEY!;

export const useUnieInfraAccessToken = () => {
    const [isConnecting, setIsConnecting] = useState(false);
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

    const LinkUnieInfra = async (user: any) => {
        if (isConnecting) return;

        setIsConnecting(true);
        if (user) {
            console.log(`user: `, user);

            const unieInfraToken: string = await LoginUnieInfra(user.id, user.id);
            if (unieInfraToken === LoginUnieInfraError) {
                updateAccessToken(null);
            } else {
                updateAccessToken(unieInfraToken);
            }
        } else {
            updateAccessToken(null);
        }
        setIsConnecting(false);
    }

    return { accessToken, isConnecting, LinkUnieInfra };
};