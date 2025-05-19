import { toast } from "sonner";

import { isDevelopment, defaultTokenName } from "@/utils/unieai/unieinfra/key";

export interface UnieInfraTokenPayload {
    accessed_time?: number,
    created_time?: number,
    expired_time: number,
    group: string,
    id?: number,
    key?: string,
    is_edit?: boolean, // create = false; edit = true;
    name: string,
    remain_quota: number,
    status?: number, // active = 1; close = 2;
    unlimited_quota: boolean,
    used_quota?: number,
    user_id?: number,
}

export interface UnieInfraTokenStatusPayload {
    id: number,
    status: number, // active = 1; close = 2;
}

export const Success: string = "success";
export const Error: string = "failed";

export const CreateDefaultToken = async (accessToken: string): Promise<string> => {
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

        const matchedTokens: any[] = _tokens.filter(
            (token: any) => token.name === defaultTokenName
        );

        if (matchedTokens.length > 0) return matchedTokens[0].key;
        else return Error;
    } else return Error;
}

export const ListUnieInfraTokens = async (accessToken: string): Promise<UnieInfraTokenPayload[]> => {
    try {
        if (isDevelopment) console.log(`try to get tokens: \r\naccessToken:\r\nBearer ${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/list", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();
        if (isDevelopment) console.log(`ListUnieInfraTokens: `, data);

        if (!res.ok) {
            return [];
        }

        return data.data;
    } catch (_err) {
        console.error("get tokens error:", _err);
        return [];
    }
}

export const PostUnieInfraToken = async (accessToken: string, payload: UnieInfraTokenPayload) => {
    try {
        if (isDevelopment) console.log(`try to post token: \r\naccessToken:\r\nBearer ${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/post", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // 注意：這時 payload 不需要展開

        });

        const data = await res.json();
        if (isDevelopment) console.log(`PostUnieInfraToken: `, data);

        if (!res.ok) {
            toast.error(Error);
            return Error;
        }

        toast.success(`Create UnieInfra token ${Success}`);
        return Success;
    } catch (_err) {
        toast.error(`Create UnieInfra token ${Error}`);
        return Error;
    }
}

export const PutUnieInfraToken = async (accessToken: string, payload: UnieInfraTokenPayload) => {
    try {
        if (isDevelopment) console.log(`try to put token: \r\naccessToken:\r\nBearer ${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/put", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // 注意：這時 payload 不需要展開

        });

        const data = await res.json();
        if (isDevelopment) console.log(`PutUnieInfraToken: `, data);

        if (!res.ok) {
            toast.error(Error);
            return Error;
        }

        toast.success(`Update UnieInfra token ${Success}`);
        return Success;
    } catch (_err) {
        toast.error(`Update UnieInfra token ${Error}`);
        return Error;
    }
}

export const PutUnieInfraTokenStatus = async (accessToken: string, payload: UnieInfraTokenStatusPayload) => {
    try {
        if (isDevelopment) console.log(`try to put token status: \r\naccessToken:\r\nBearer ${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/status", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // 注意：這時 payload 不需要展開

        });

        const data = await res.json();
        if (isDevelopment) console.log(`PutUnieInfraTokenStatus: `, data);

        if (!res.ok) {
            toast.error(Error);
            return Error;
        }

        toast.success(`Update UnieInfra token status ${Success}`);
        return Success;
    } catch (_err) {
        toast.error(`Update UnieInfra token status ${Error}`);
        return Error;
    }
}

export const DeleteUnieInfraToken = async (accessToken: string, id: number) => {
    try {
        if (isDevelopment) console.log(`try to delete token: \r\naccessToken:\r\nBearer ${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/delete", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),

        });

        const data = await res.json();
        if (isDevelopment) console.log(`DeleteUnieInfraToken: `, data);

        if (!res.ok) {
            toast.error(Error);
            return Error;
        }

        toast.success(`Delete UnieInfra token ${id} ${Success}`);
        return Success;
    } catch (_err) {
        toast.error(`Delete UnieInfra token ${id} ${Error}`);
        return Error;
    }
}