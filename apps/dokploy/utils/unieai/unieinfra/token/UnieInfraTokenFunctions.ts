import { toast } from "sonner";

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

export const ListUnieInfraTokens = async (accessToken: string) => {
    try {
        console.log(`try to get tokens: \r\naccessToken:${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/list", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();

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
        console.log(`try to get tokens: \r\naccessToken:${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/post", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // 注意：這時 payload 不需要展開

        });

        const data = await res.json();

        console.log(`data: `, data);

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
        console.log(`try to get tokens: \r\naccessToken:${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/put", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // 注意：這時 payload 不需要展開

        });

        const data = await res.json();

        console.log(`data: `, data);

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
        console.log(`try to get tokens: \r\naccessToken:${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/status", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // 注意：這時 payload 不需要展開

        });

        const data = await res.json();

        console.log(`data: `, data);

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
        console.log(`try to get tokens: \r\naccessToken:${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/delete", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({id}),

        });

        const data = await res.json();

        console.log(`data: `, data);

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