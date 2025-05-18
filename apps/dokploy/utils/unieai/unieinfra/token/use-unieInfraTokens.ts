import { useState } from "react";
import { isDevelopment } from "@/utils/unieai/unieinfra/key";
import {
    ListUnieInfraTokens,
    PostUnieInfraToken,
    PutUnieInfraToken,
    PutUnieInfraTokenStatus,
    DeleteUnieInfraToken,
    UnieInfraTokenPayload,
    UnieInfraTokenStatusPayload,
    Success,
    Error
} from "./UnieInfraTokenFunctions";

export const useUnieInfraTokens = () => {
    const [isGetting, setIsGetting] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [isPuting, setIsPuting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [tokens, setTokens] = useState([]);

    const getTokens = async (accessToken: string) => {
        if (isGetting) return;

        setIsGetting(true);
        const _tokens = await ListUnieInfraTokens(accessToken);
        if (isDevelopment) console.log(`_tokens: `, _tokens);
        setTokens(_tokens);
        setIsGetting(false);
    };

    const postToken = async (accessToken: string, payload: UnieInfraTokenPayload): Promise<string> => {
        if (isPosting) return Error;

        setIsPosting(true);
        const result = await PostUnieInfraToken(accessToken, payload);
        setIsPosting(false);

        if (result === Success) {
            const _tokens = await ListUnieInfraTokens(accessToken);
            setTokens(_tokens);
        }
        return result;
    };

    const putToken = async (accessToken: string, payload: UnieInfraTokenPayload): Promise<string> => {
        if (isPuting) return Error;

        setIsPuting(true);
        const result = await PutUnieInfraToken(accessToken, payload);
        setIsPuting(false);

        if (result === Success) {
            const _tokens = await ListUnieInfraTokens(accessToken);
            setTokens(_tokens);
        }
        return result;
    };

    const putTokenStatus = async (accessToken: string, payload: UnieInfraTokenStatusPayload): Promise<string> => {
        if (isPuting) return Error;

        setIsPuting(true);
        const result = await PutUnieInfraTokenStatus(accessToken, payload);
        setIsPuting(false);

        if (result === Success) {
            const _tokens = await ListUnieInfraTokens(accessToken);
            setTokens(_tokens);
        }
        return result;
    };

    const deleteToken = async (accessToken: string, id: number): Promise<string> => {
        if (isDeleting) return Error;

        setIsDeleting(true);
        const result = await DeleteUnieInfraToken(accessToken, id);
        setIsDeleting(false);

        if (result === Success) {
            const _tokens = await ListUnieInfraTokens(accessToken);
            setTokens(_tokens);
        }
        return result;
    };

    return { tokens, getTokens, postToken, putToken, putTokenStatus, deleteToken, isLoading: (isGetting || isPosting || isPuting || isDeleting) };
};