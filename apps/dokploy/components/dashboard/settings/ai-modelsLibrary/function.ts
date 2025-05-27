import { ModelData_Payload, marker } from ".";

export const fetchModelDatas = async (): Promise<ModelData_Payload[]> => {

    const aaa: ModelData_Payload[] = [
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
        },
        {
            "name": "Qwen/Qwen3-235B-A22B",
            "img_src": "https://unie-backstage.unieai.com/api/mongodb/projects/image/get_image_by_id?image_id=44677346-ae62-48e0-877d-72eb1567e9b8",
            "provider": "Qwen",
            "description": "Qwen3-235B-A22B is a state-of-the-art large language model developed by Alibaba's Qwen team, featuring 235 billion parameters with a Mixture-of-Experts (MoE) architecture. It is instruction-tuned for multi-turn dialogue, reasoning, and multilingual understanding, achieving performance comparable to GPT-4 and Claude 3. The model supports a context window up to 128K tokens.",
            "marker": marker.Text,
            "cost": "Input price:    $0.020/ 1K  \nOutput price:   $0.040/ 1K",
            "tokens": "128K"
        },
        {
            "name": "meta-llama/Llama-4-Scout-17B-16E-Instruct",
            "img_src": "https://unie-backstage.unieai.com/api/mongodb/projects/image/get_image_by_id?image_id=54c6070f-54a6-4f38-9b06-92f20dbd5566",
            "provider": "meta-llama",
            "description": "Llama-4-Scout-17B-16E-Instruct is a natively multimodal large language model developed by Meta, featuring a mixture-of-experts architecture with 17 billion activated parameters and 16 experts (109B total). It supports a context window of 128K tokens and is instruction-tuned for assistant-like chat, visual reasoning, and multilingual tasks across 12 languages. The model excels in text and image understanding, code generation, and multi-turn dialogue, with a knowledge cutoff of August 2024.",
            "marker": marker.Text,
            "cost": "Input price:    $0.080/ 1K\nOutput price:   $0.300/ 1K",
            "tokens": "128K"
        }
    ];

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
