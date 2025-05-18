import { toast } from "sonner";

import { isDevelopment } from "@/utils/unieai/unieinfra/key";

export const ListUnieInfraGroups = async (accessToken: string) => {
    try {
        if (isDevelopment) console.log(`try to get groups: \r\naccessToken:\r\nBearer ${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/group/user_group_map", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();
        if (isDevelopment) console.log(`ListUnieInfraGroups: `, data);

        if (!res.ok) {
            return [];
        }

        return data.data;
    } catch (_err) {
        console.error("get groups error:", _err);
        return [];
    }
}