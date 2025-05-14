import { toast } from "sonner";

export interface CreateUnieInfraTokenPayload {
    expired_time: number,
    group: string,
    is_edit: boolean,
    name: string,
    remain_quota: number,
    unlimited_quota: boolean,
}

export const CreateUnieInfraTokenSuccess: string = "Create UnieInfra token success";
export const CreateUnieInfraTokenError: string = "Create UnieInfra token failed";

export const CreateUnieInfraToken = async (accessToken: string, payload: CreateUnieInfraTokenPayload) => {
    try {
        console.log(`try to get tokens: \r\naccessToken:${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/create", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // 注意：這時 payload 不需要展開了

        });

        const data = await res.json();

        console.log(`data: `, data);

        if (!res.ok) {
            toast.error(CreateUnieInfraTokenError);
            return CreateUnieInfraTokenError;
        }

        toast.success(CreateUnieInfraTokenSuccess);
        return CreateUnieInfraTokenSuccess;
    } catch (_err) {
        toast.error(CreateUnieInfraTokenError);
        return CreateUnieInfraTokenError;
    }
}