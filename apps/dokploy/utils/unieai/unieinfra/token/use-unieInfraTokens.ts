import { useState } from "react";
import { isDevelopment, AI_PLAYGROUND_UNIEINFRA_DEFAULT_TOKEN_NAME } from "@/utils/unieai/unieinfra/key";
import {
    CreateDefaultToken,
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
    const [isSettingDefault, setIsSettingDefault] = useState(false);
    const [isGetting, setIsGetting] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [isPuting, setIsPuting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [tokens, setTokens] = useState<UnieInfraTokenPayload[]>([]);
    const [defaultToken, setDefaultToken] = useState<string | null>(null);

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

    const fetchDefaultToken = async (accessToken: string, reCreateToken: boolean): Promise<string> => {
        if (isSettingDefault) return Error;

        setIsSettingDefault(true);

        // 取得當前擁有的 tokens
        let _tokens = await ListUnieInfraTokens(accessToken);
        // 確認是否包含 AI_PLAYGROUND_UNIEINFRA_DEFAULT_TOKEN_NAME
        const matchedTokens: UnieInfraTokenPayload[] = _tokens.filter(
            token => token.name === AI_PLAYGROUND_UNIEINFRA_DEFAULT_TOKEN_NAME
        );

        let result = "";
        if (matchedTokens.length > 0) {
            if (reCreateToken || matchedTokens.length > 1) {
                // 刪除既有 token
                for (const targetToken of matchedTokens) {
                    const deleteRes = await DeleteUnieInfraToken(accessToken, targetToken.id!);
                }
                // 重新生成 defaultToken
                result = await CreateDefaultToken(accessToken);
            } else {
                result = matchedTokens[0]?.key!;
            }
        } else {
            // 重新生成 defaultToken
            result = await CreateDefaultToken(accessToken);
        }

        if (result !== Error) {
            if (isDevelopment) console.log(`UnieInfra default token:\r\nsk-${result}`);
            setDefaultToken(result);
        }
        else {
            if (isDevelopment) console.warn(`UnieInfra fetch default token Error`);
            setDefaultToken(null);
        }

        _tokens = await ListUnieInfraTokens(accessToken);
        setTokens(_tokens);

        setIsSettingDefault(false);

        return result;
    };

    return { tokens, defaultToken, fetchDefaultToken, getTokens, postToken, putToken, putTokenStatus, deleteToken, isLoading: (isSettingDefault || isGetting || isPosting || isPuting || isDeleting) };
};