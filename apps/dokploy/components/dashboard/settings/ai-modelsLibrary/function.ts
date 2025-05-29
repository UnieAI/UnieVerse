import { ModelData_Payload, marker } from ".";
import { isDevelopment } from "@/utils/unieai/unieinfra/key";

export const fetchModelDatas = async (): Promise<ModelData_Payload[]> => {
    try {
        const response = await fetch("/api/unieai/backstage/get_models", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data: ModelData_Payload[] = await response.json();
        if (isDevelopment) console.log(`backstage get_models data: `, data)

        return data;
    } catch (error) {
        console.error('fetchModelDatas error:', error);
        return [];
    }
};

export const fetchServiceModels = async (url: string, token: string): Promise<any[]> => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();

        return data.data;
    } catch (error) {
        console.error('fetchServiceModels error:', error);
        return [];
    }
};
