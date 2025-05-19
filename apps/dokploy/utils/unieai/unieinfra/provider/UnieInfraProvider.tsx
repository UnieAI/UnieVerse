'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

import { defaultTokenName } from '../key';
import { UnieInfraTokenPayload, UnieInfraTokenStatusPayload } from "../token/UnieInfraTokenFunctions";

import { useUnieInfraAccessToken } from '../user/use-unieInfraAccessToken';
import { useUnieInfraTokens } from '../token/use-unieInfraTokens';
import { useUnieInfraGroups } from '../group/use-unieInfraGroups';

interface UnieInfraContextValue {
    // link
    accessToken: string | null;
    LinkUnieInfra: (user: any) => Promise<void>;
    isConnecting: boolean;
    // token
    tokens: UnieInfraTokenPayload[];
    defaultToken: string | null;
    fetchDefaultToken: (accessToken: string, reCreateToken: boolean) => Promise<string>;
    getTokens: (accessToken: string) => Promise<void>;
    postToken: (accessToken: string, payload: UnieInfraTokenPayload) => Promise<string>;
    putToken: (accessToken: string, payload: UnieInfraTokenPayload) => Promise<string>;
    putTokenStatus: (accessToken: string, payload: UnieInfraTokenStatusPayload) => Promise<string>;
    deleteToken: (accessToken: string, id: number) => Promise<string>;
    isLoadingTokens: boolean;
    //group
    groups: any[];
    getGroups: (accessToken: string) => Promise<void>;
    isLoadingGroups: boolean;
}

const UnieInfraContext = createContext<UnieInfraContextValue | undefined>(undefined);

export const UnieInfraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const { accessToken, LinkUnieInfra, isLoading: isConnecting } = useUnieInfraAccessToken();
    const { tokens, defaultToken, fetchDefaultToken, getTokens, postToken, putToken, putTokenStatus, deleteToken, isLoading: isLoadingTokens } = useUnieInfraTokens();
    const { groups, getGroups, isLoading: isLoadingGroups } = useUnieInfraGroups();

    // accessToken 更新時 自動更新 tokens, defaultToken, groups
    useEffect(() => {
        const fetchUnieInfraDefaultToken = async (accessToken: string) => {
            await fetchDefaultToken(accessToken, false); // 不強制重建新 default token
        };

        if (accessToken) {
            // 確認是否包含 defaultTokenName
            const matchedToken = tokens.find(token =>
                token.name && token.name.includes(defaultTokenName)
            );

            if (!matchedToken) fetchUnieInfraDefaultToken(accessToken);

            getGroups(accessToken);
        }
    }, [accessToken]);

    return (
        <UnieInfraContext.Provider value={{
            accessToken, LinkUnieInfra, isConnecting,
            tokens, defaultToken, fetchDefaultToken, getTokens, postToken, putToken, putTokenStatus, deleteToken, isLoadingTokens,
            groups, getGroups, isLoadingGroups
        }}>
            {children}
        </UnieInfraContext.Provider>
    );
};

export const useUnieInfra = () => {
    const context = useContext(UnieInfraContext);
    if (!context) {
        throw new Error('useUnieInfra must be used within a UnieInfraProvider');
    }
    return context;
};