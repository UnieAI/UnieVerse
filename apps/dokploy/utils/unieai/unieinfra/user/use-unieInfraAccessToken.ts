import { useEffect, useState } from "react";
import { LoginUnieInfra, LoginUnieInfraError } from "./LoginUnieInfra";
import { ACCESS_TOKEN_KEY } from "@/utils/unieai/unieinfra/key";

export const useUnieInfraAccessToken = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    // 初始化：讀取 localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        setAccessToken(storedToken);
    }, []);

    const updateAccessToken = (newToken: string | null) => {
        if (newToken) {
            localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
        } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
        setAccessToken(newToken);
    };

    const LinkUnieInfra = async (user: any) => {
        if (isLoading) return;

        console.log(`try fetch LinkUnieInfra...`);
        setIsLoading(true);
        if (user) {
            console.log(`user: `, user);

            const unieInfraToken: string = await LoginUnieInfra(user.id, user.id);
            if (unieInfraToken === LoginUnieInfraError) {
                console.log(`try fetch LinkUnieInfra failed`);
                updateAccessToken(null);
            } else {
                console.log(`try fetch LinkUnieInfra success`);
                updateAccessToken(unieInfraToken);
            }
        } else {
            console.log(`try fetch LinkUnieInfra failed: no user`);
            updateAccessToken(null);
        }
        setIsLoading(false);
    }

    return { accessToken, LinkUnieInfra, isLoading };
};