import type { NextApiRequest, NextApiResponse } from "next";
import { ModelData_Payload } from "@/components/dashboard/settings/ai-modelsLibrary";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    console.log(`/api/backstage/get_models: hi`)
    try {
        const response = await fetch('https://unie-backstage.unieai.com/api/mongodb/projects/model/get_models', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data: ModelData_Payload[] = await response.json();
        console.log(`ModelData: `, data)
        return res.status(200).json(data);

    } catch (error: any) {
        console.error(`fetchModelDatas error:`, error.message);
        return res.status(500).json({ message: "fetchModelDatas failed.", error: error.message });
    }
}