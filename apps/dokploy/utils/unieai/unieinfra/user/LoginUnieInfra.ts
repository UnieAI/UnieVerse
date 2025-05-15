import { toast } from "sonner";

export const LoginUnieInfraError: string = "Login UnieInfra failed";

export const LoginUnieInfra = async (username: string, password: string): Promise<string> => {
    try {
        console.log(`try to login uniefra: \r\nuser:${username}\r\npassword:${password}`);

        const res = await fetch("/api/unieai/unieinfra/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

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
