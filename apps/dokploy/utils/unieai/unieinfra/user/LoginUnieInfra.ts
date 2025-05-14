import { toast } from "sonner";

const TOKEN_KEY = process.env.NEXT_PUBLIC_UNIEINFRA_ACCESS_TOKEN_KEY!;

const LoginUnieInfraError: string = "Login UnieInfra failed";

const LoginUnieInfra = async (username: string, password: string): Promise<string> => {
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
            return LoginUnieInfraError;
        }

        return data.accessToken;
    } catch (_err) {
        console.error("Login UnieInfra error:", _err);
        return LoginUnieInfraError;
    }
}

export const LinkUnieInfra = async ( 
    user: any,
    setToken: (token: string | null) => void,
 ) => {
    if (user) {
        console.log(`user: `, user);

        const unieInfraToken: string = await LoginUnieInfra(user.id, user.id);
        if (unieInfraToken === LoginUnieInfraError) {
            setToken(null);
            toast.warning("Unable to connect to UnieInfra. Please try again later.");
        } else {
            setToken(unieInfraToken);
            console.log(`Unieinfra access token: ${localStorage.getItem(TOKEN_KEY)}`);
        }
    } else {
        setToken(null);
        console.warn(`No user data input...`);
    }
}
