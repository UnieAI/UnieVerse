// pages/api/unieai/unieInfra/token/put.ts

import type { NextApiRequest, NextApiResponse } from "next";

import { UNIEINFRA_SYSTEM_API_URL } from "@/utils/unieai/unieinfra/key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const accessToken = authHeader.replace("Bearer ", "");

    try {
        console.log(`[UnieInfra] update token status by accessToken: ${accessToken}`);

        const response = await fetch(`${UNIEINFRA_SYSTEM_API_URL}/token?status_only=true`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            }, body: JSON.stringify({
                ...req.body
            }),
        });

        const result = await response.json();
        console.log(`[UnieInfra] update token status result:`, result);

        if (!response.ok || result.success === false) {
            console.error(`[UnieInfra] Failed to update token status:`, result);
            return res.status(400).json({
                message: result.message,
                error: result,
            });
        }

        return res.status(response.status).json(result);
    } catch (error: any) {
        console.error(`[UnieInfra] Unexpected error while updating token status:`, error.message);
        return res.status(500).json({ message: "UnieInfra update token status failed", error: error.message });
    }
}