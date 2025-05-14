// pages/api/unieai/unieInfra/token/token.ts

import type { NextApiRequest, NextApiResponse } from "next";

const UNIEINFRA_API_URL = process.env.UNIEINFRA_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { accessToken } = req.body;

    try {
        console.log(`[UnieInfra] get tokens by accessToken: ${accessToken}`);

        const pageSize = 10;
        let page = 1;
        let allData: any[] = [];
        let totalCount = 0;

        while (true) {
            const response = await fetch(`${UNIEINFRA_API_URL}/token?page=${page}&size=${pageSize}&keyword=&order=-id`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
            });

            const result = await response.json();
            console.log(`[UnieInfra] page ${page} result:`, result);

            const currentPageData = result.data?.data || [];
            totalCount = result.data?.total_count || 0;

            allData = allData.concat(currentPageData);

            if (currentPageData.length < pageSize) {
                break;
            }

            page += 1;
        }

        return res.status(200).json({ message: "Success", data: allData });

    } catch (error: any) {
        console.error(`[UnieInfra] Unexpected error while getting tokens:`, error.message);
        return res.status(500).json({ message: "UnieInfra get tokens failed", error: error.message });
    }
}