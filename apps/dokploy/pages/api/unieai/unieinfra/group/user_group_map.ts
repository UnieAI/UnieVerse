// pages/api/unieai/unieInfra/group/user_group_map.ts

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

    try {
        console.log(`[UnieInfra] get groups by accessToken: ${accessToken}`);

        const response = await fetch(`${UNIEINFRA_SYSTEM_API_URL}/user_group_map`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
        });

        const result = await response.json();
        console.log(`[UnieInfra] groups result:`, result);

        // 如果 result.data 是 object，就轉成陣列；不是就回傳 []
        const groups =
            result?.data && typeof result.data === "object"
                ? Object.values(result.data)
                : [];

        return res.status(200).json({ message: "Success", data: groups });

    } catch (error: any) {
        console.error(`[UnieInfra] Unexpected error while getting groups:`, error.message);
        return res.status(500).json({ message: "UnieInfra get groups failed", error: error.message });
    }
}