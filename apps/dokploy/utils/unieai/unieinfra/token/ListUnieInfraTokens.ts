import { toast } from "sonner";

export const ListUnieInfraTokens = async (accessToken: string) => {
    try {
        console.log(`try to get tokens: \r\naccessToken:${accessToken}`);

        const res = await fetch("/api/unieai/unieinfra/token/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ accessToken }),
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