import { useState } from "react";
import { isDevelopment, defaultTokenName } from "@/utils/unieai/unieinfra/key";
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
    const [tokens, setTokens] = useState<UnieInfraTokenPayload[]>([]);

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

    const createDefaultToken = async (accessToken: string): Promise<string | undefined> => {
        const payload: UnieInfraTokenPayload = {
            expired_time: -1,
            group: "",
            name: defaultTokenName,
            remain_quota: 0,
            unlimited_quota: true,
        }
        const postRes = await PostUnieInfraToken(accessToken, payload);
        if (postRes === Success) {
            const _tokens = await ListUnieInfraTokens(accessToken);
            setTokens(_tokens);

            const matchedTokens: any[] = _tokens.filter(
                (token: any) => token.name === defaultTokenName
            );

            if (matchedTokens.length > 0) return matchedTokens[0].key;
            else return undefined;
        } else return undefined;
    }

    const getDefaultToken = async (accessToken: string, reCreateToken: boolean): Promise<string | undefined> => {
        // 取得當前擁有的 tokens
        const _tokens = await ListUnieInfraTokens(accessToken);
        // 確認是否包含 defaultTokenName
        const matchedTokens: UnieInfraTokenPayload[] = _tokens.filter(
            token => token.name === defaultTokenName
        );

        if (matchedTokens.length > 0) {
            if (reCreateToken || matchedTokens.length > 1) {
                // 刪除既有 token
                for (const targetToken of matchedTokens) {
                    const deleteRes = await deleteToken(accessToken, targetToken.id!);
                }
                // 重新生成 defaultToken
                const token = await createDefaultToken(accessToken);
                return token;
            } else {
                setTokens(_tokens);
                return matchedTokens[0]?.key;
            }
        } else {
            // 重新生成 defaultToken
            const token = await createDefaultToken(accessToken);
            return token;
        }
    };

    return { tokens, getDefaultToken, getTokens, postToken, putToken, putTokenStatus, deleteToken, isLoading: (isGetting || isPosting || isPuting || isDeleting) };
};