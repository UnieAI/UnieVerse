import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles } from 'lucide-react'

import { AI_PLAYGROUND_TAB_VALUE, UNIEINFRA_OPENAI_API_URL } from "@/utils/unieai/unieinfra/key";
import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

import { ModelData_Payload, marker } from '.';

interface ModelPlaygroundBtnProps {
    serviceModels: any[];
    title: string;
    model: ModelData_Payload;
    className?: string;
}

export const ModelPlaygroundBtn: React.FC<ModelPlaygroundBtnProps> = ({
    serviceModels,
    title,
    model,
    className,
}) => {
    const router = useRouter();

    const { defaultToken } = useUnieInfra();

    const handleTryIt = (modelUrl_id: string) => {
        const _model: string = modelUrl_id;
        const _tab: string = AI_PLAYGROUND_TAB_VALUE.UNIEINFRA;
        const _api: string = UNIEINFRA_OPENAI_API_URL;
        const _token: string | null = defaultToken;
        router.push(`/dashboard/settings/ai-playground?model=${_model}&tab=${_tab}&token=${_token}&api=${_api}`);
    };

    return (
        <>
            {defaultToken !== null && (
                <div className={className}>
                    {(serviceModels.some(serviceModel => (serviceModel.id === model.name))) && (
                        <Button
                            className="relative inline-flex h-8 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                            onClick={() => handleTryIt(model.name)}
                        >
                            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black px-3 text-xs font-medium text-white backdrop-blur-3xl gap-2 hover:bg-opacity-80 transition-colors duration-300">
                                <Sparkles className="w-4 h-4" />
                                {title}
                            </span>
                        </Button>
                    )}
                </div>
            )}
        </>
    )
}