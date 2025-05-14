import { useEffect, useState } from "react";
import { ListUnieInfraTokens } from "./ListUnieInfraTokens";

export const useUnieInfraTokens = () => {
    const [isLoadingTokens, setIsLoadingTokens] = useState(false);
    const [tokens, setTokens] = useState([]);

    const updateTokens = async (accessToken: string) => {
        if (isLoadingTokens) return;
        
        setTokens([]);
        setIsLoadingTokens(true);
        const _tokens = await ListUnieInfraTokens(accessToken);
        console.log(`_tokens: `, _tokens);
        setTokens(_tokens);
        setIsLoadingTokens(false);
    };

    return { tokens, setTokensByAccessToken: updateTokens, isLoadingTokens };
};