import type { NextApiRequest, NextApiResponse } from "next";
import { UNIEINFRA_SYSTEM_API_URL } from "@/utils/unieai/unieinfra/key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method Not Allowed" });
	}

	const { name, base_url, key, models } = req.body;

    const authHeader = req?.headers?.authorization || "";

    const accessToken = authHeader.replace("Bearer ", "");

	try {
		console.log(`[UnieInfra] Registering new model channel: ${base_url}`);
		const payload = {
				name,
				key,
				base_url,
				models,
				type: 1,
		}

		console.log(`[UnieInfra][Channel] payload: ${JSON.stringify(payload)}`)
		const regRes = await fetch(`${UNIEINFRA_SYSTEM_API_URL}/channel`, {
			method: "POST",
			headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
			body: JSON.stringify(payload),
		});

		const regData = await regRes.json();
		console.log(`[UnieInfra] Login response:`, regData);
        return res.status(202).json({ message: "Channel registration in progress", detail: regData });

	} catch (error: any) {
		console.error(`[UnieInfra] Unexpected error`, error.message);
		return res.status(500).json({ message: "UnieInfra Channel registration failed.", error: error.message });
	}
}