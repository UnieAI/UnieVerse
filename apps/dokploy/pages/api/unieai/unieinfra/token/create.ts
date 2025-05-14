// pages/api/unieai/unieInfra/token/create.ts

import type { NextApiRequest, NextApiResponse } from "next";

const UNIEINFRA_API_URL = process.env.UNIEINFRA_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const {
        expired_time,
        group,
        is_edit,
        name,
        remain_quota,
        unlimited_quota,
    } = req.body;

    try {
        console.log(`[UnieInfra] create token by accessToken: ${accessToken}`);

        const response = await fetch(`${UNIEINFRA_API_URL}/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            }, body: JSON.stringify({
                ...req.body
            }),
        });

        const result = await response.json();
        console.log(`[UnieInfra] create token result:`, result);

        if (!response.ok) {
            console.error(`[UnieInfra] Failed to create token:`, result);
            return res.status(response.status).json({
                message: "UnieInfra create token failed",
                error: result,
            });
        }

        // 應該要有這一行，回傳結果給前端
        return res.status(response.status).json(result);
    } catch (error: any) {
        console.error(`[UnieInfra] Unexpected error while creating token:`, error.message);
        return res.status(500).json({ message: "UnieInfra create token failed", error: error.message });
    }
}