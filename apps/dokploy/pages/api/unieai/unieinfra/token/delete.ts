// pages/api/unieai/unieInfra/token/delete.ts

import type { NextApiRequest, NextApiResponse } from "next";

import { UNIEINFRA_SYSTEM_API_URL } from "@/utils/unieai/unieinfra/key/key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const { id } = req.body;

    try {
        console.log(`[UnieInfra] delete token by token id: ${accessToken}`);

        const response = await fetch(`${UNIEINFRA_SYSTEM_API_URL}/token/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
        });

        const result = await response.json();
        console.log(`[UnieInfra] delete token result:`, result);

        if (!response.ok) {
            console.error(`[UnieInfra] Failed to delete token ${id}:`, result);
            return res.status(response.status).json({
                message: `UnieInfra delete token ${id} failed`,
                error: result,
            });
        }

        return res.status(response.status).json(result);
    } catch (error: any) {
        console.error(`[UnieInfra] Unexpected error while deleting token ${id}:`, error.message);
        return res.status(500).json({ message: `UnieInfra delete token ${id} failed`, error: error.message });
    }
}