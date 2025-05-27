import { ModelData_Payload,marker } from ".";

export const fetchModelDatas = async (): Promise<ModelData_Payload[]> => {

    const aaa:ModelData_Payload[] = [
        {
            "name": "aqua-mini",
            "img_src": "https://unie-backstage.unieai.com/api/mongodb/projects/image/get_image_by_id?image_id=189a6303-4c3e-437d-ad9a-bcb806a0efbc",
            "provider": "UnieAI",
            "description": "Aqua-mini is the best large language model provided by UnieAI.",
            "marker": marker.Text,
            "cost": "Input price:    $0.003/ 1K\nOutput price: $0.009/ 1K",
            "tokens": "8000+"
        },
        {
            "name": "Qwen3_0_6B",
            "img_src": "https://unie-backstage.unieai.com/api/mongodb/projects/image/get_image_by_id?image_id=d212eabb-f625-4c82-bf9e-f2dd561901c3",
            "provider": "Qwen",
            "description": "Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models.",
            "marker": marker.Text,
            "cost": "Input price:    $0.9/ 1K\nOutput price: $0.9/ 1K",
            "tokens": "?"
        },
        {
            "name": "Meta-Llama-3.1-405B-Instruct",
            "img_src": "https://unie-backstage.unieai.com/api/mongodb/projects/image/get_image_by_id?image_id=079f3bfb-8233-483c-b724-bf6096f8ce09",
            "provider": "meta-llama",
            "description": "Meta developed and released the Meta Llama 3.1 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8B, 70B and 405B sizes",
            "marker": marker.Text,
            "cost": "Input price:    $0.000/ 1K\nOutput price: $0.000/ 1K",
            "tokens": "40.5M"
        }
    ]

    return aaa;

    // try {
    //     const response = await fetch('https://unie-backstage.unieai.com/api/mongodb/projects/model/get_models', {
    //         method: 'GET',
    //         headers: {
    //             'Authorization': 'Bearer UnieAI9487',
    //             'Content-Type': 'application/json',
    //         },
    //     });

    //     if (!response.ok) {
    //         console.error(`API error: ${response.status} ${response.statusText}`);
    //         return [];
    //     }

    //     const data: ModelData_Payload[] = await response.json();

    //     return data;
    // } catch (error) {
    //     console.error('fetchModelDatas error:', error);
    //     return [];
    // }
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
