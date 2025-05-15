'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

import { UnieInfraTokenPayload, UnieInfraTokenStatusPayload } from "../token/UnieInfraTokenFunctions";

import { useUnieInfraAccessToken } from '../user/use-unieInfraAccessToken';
import { useUnieInfraTokens } from '../token/use-unieInfraTokens';
import { useUnieInfraGroups } from '../group/use-unieInfraGroups';

interface UnieInfraContextValue {
    // link
    accessToken: string | null;
    isConnecting: boolean;
    LinkUnieInfra: (user: any) => Promise<void>;
    // token
    tokens: UnieInfraTokenPayload[];
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
    const { tokens, getTokens, postToken, putToken, putTokenStatus, deleteToken, isLoading: isLoadingTokens } = useUnieInfraTokens();
    const { groups, getGroups, isLoading: isLoadingGroups } = useUnieInfraGroups();

    return (
        <UnieInfraContext.Provider value={{
            accessToken, isConnecting, LinkUnieInfra,
            tokens, getTokens, postToken, putToken, putTokenStatus, deleteToken, isLoadingTokens,
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