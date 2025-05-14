import { toast } from "sonner";

export const ListUnieInfraGroups = async (accessToken: string) => {
    try {
        console.log(`try to get groups: \r\naccessToken:${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/group/user_group_map", {
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
        console.error("get groups error:", _err);
        return [];
    }
}