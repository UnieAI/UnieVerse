// /pages/api/fetch-models.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" });
	}

	const { base_url, api_key } = req.body;

	if (!base_url) {
		return res.status(400).json({ message: "Missing base_url or api_key" });
	}

	try {
		const application_url = new URL('/v1/models', base_url)
		if (!application_url) {
			return res.status(400).json({ message: "Invalid base_url" });
		}
		console.log(`[UnieInfra] Fetching models from: ${application_url}`);

		const response = await fetch(application_url, {
			headers: {
				Authorization: `Bearer ${api_key}`,
			},
		});
		const json = await response.json();
		
		console.log(`[UnieInfra] Model fetch response:`, json);

		if (!response.ok || !json.data) {
			throw new Error("Invalid response from model server");
		}

		const models = json.data.map((item: any) => item.id);
		return res.status(200).json({ models });
	} catch (err: any) {
		console.error(err);
		return res.status(500).json({ message: err.message || "Server error" });
	}
}
