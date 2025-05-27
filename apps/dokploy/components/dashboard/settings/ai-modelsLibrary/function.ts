import { ModelData_Payload } from ".";

export const fetchModelDatas = async (): Promise<ModelData_Payload[]> => {
    try {
        const response = await fetch('https://unie-backstage.unieai.com/api/mongodb/projects/model/get_models', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer UnieAI9487',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data: ModelData_Payload[] = await response.json();

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
