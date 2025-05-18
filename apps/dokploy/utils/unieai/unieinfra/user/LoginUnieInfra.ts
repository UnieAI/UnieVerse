import { toast } from "sonner";

import { isDevelopment } from "@/utils/unieai/unieinfra/key";

export const LoginUnieInfraError: string = "Login UnieInfra failed";

export const LoginUnieInfra = async (username: string, password: string): Promise<string> => {
    try {
        if (isDevelopment) console.log(`try to login uniefra: \r\nuser:\r\n${username}\r\npassword:\r\n${password}`);

        const res = await fetch("/api/unieai/unieinfra/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (isDevelopment) console.log(`LoginUnieInfra: `, data);

        if (!res.ok || !data.accessToken) {
            toast.warning("Unable to connect to UnieInfra. Please try again later.");
            return LoginUnieInfraError;
        }

        toast.success(`Unieinfra Connected！`);
        return data.accessToken;
    } catch (_err) {
        console.error("Login UnieInfra error:", _err);
        toast.warning("Unable to connect to UnieInfra. Please try again later.");
        return LoginUnieInfraError;
    }
}
