// connect-ai.tsx
"use client";
import {
    Dialog, DialogTrigger, DialogContent,
    DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from "@/components/ui/form";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BotMessageSquare } from "lucide-react";


const schema = z.object({
    name: z.string().min(1),
    api_key: z.string().optional(),
    base_url: z.string().url(),
    model: z.string().min(1),
});

export default function ConnectAIForm({ appurl, data }: { appurl?: string, data: any }) {

    const { accessToken } = useUnieInfra();

    // const [models, setModels] = useState<string[]>([]);
    const [thisModel, setThisModel] = useState<string>();
    // const formatted_appurl = appurl.endsWith('/') ? appurl.slice(0, -1) : appurl;
    // const ai_appurl = `${formatted_appurl}/v1`;
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            base_url: appurl || "",
            api_key: "",
            model: "",
        },
    });

    useEffect(() => {
        if (appurl) form.setValue("base_url", appurl);
    }, [appurl, form]);


    // const fetchModels = async () => {
    // 	const { base_url, api_key } = form.getValues();
    // 	try {
    // 		const res = await fetch("/api/unieai/unieinfra/providers/openai/models", {
    // 			method: "POST",
    // 			headers: { "Content-Type": "application/json" },
    // 			body: JSON.stringify({ base_url, api_key }),
    // 		});
    // 		const json = await res.json();
    // 		if (!res.ok) throw new Error(json.message);
    // 		setModels(json.models);
    // 		toast.success("Models fetched");
    // 	} catch (err: any) {
    // 		toast.error("Model fetch failed: " + err.message);
    // 	}
    // };

    const onSubmit = async (values: z.infer<typeof schema>) => {
        console.log("Access token:", accessToken)



        const res = await fetch("/api/unieai/unieinfra/channels/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                name: values.name,
                base_url: values.base_url,
                key: values.api_key,
                models: values.model,
            }),
        });
        const json = await res.json();
        if (res.ok) {
            toast.success("LLM added. Access Token: " + json.accessToken);
        } else {
            toast.error("Failed: " + json.message);
        }
    };

    const connectUnieInfra = async () => {
        let model;
        const api_key = "0"
        const cleanedUrl = appurl?.replace(/\/$/, '');
        try {
            const res = await fetch("/api/unieai/unieinfra/providers/openai/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base_url: cleanedUrl, api_key }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            model = json.models;
            toast.success("Models fetched");
            const res1 = await fetch("/api/unieai/unieinfra/channels/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    name: data.composeId,
                    base_url: cleanedUrl,
                    key: api_key,
                    models: model.join(','),
                }),
            });
            const json1 = await res1.json();
            if (res.ok) {
                setOpen(true)
                setIsConnect(2)
                setThisModel(model.join(','))
                toast.success("LLM added. Access Token: " + json1.accessToken);
            } else {
                setOpen(false)
                toast.error("Failed: " + json1.message);
            }
        } catch (err: any) {
             setOpen(true)
            setIsConnect(2)
            toast.error("Model fetch failed: " + err.message);
        }
        console.log(model, data.composeId, cleanedUrl)

    }

    const [open, setOpen] = useState<boolean>(false);
    const [isConnect, setIsConnect] = useState<number>(-1)

    return (
        <TooltipProvider>
            {/* Tooltip Trigger */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        className="p-0"
                        variant="ghost"
                        onClick={() => {
                            // setOpen(true)
                            setIsConnect(1)
                            connectUnieInfra()
                        }}
                    >
                        <img src="/unieinfra-logo.png" className={`size-6 rounded-full ${isConnect <= 1 && 'grayscale'}`} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Add AI model to UnieInfra Hub</p>
                </TooltipContent>
            </Tooltip>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-center pt-5">UnieInfea API Connected 🎉</DialogTitle>
                        <DialogDescription className="text-center pt-3">You can simply use https://api.unieai.com to access this model</DialogDescription>
                    </DialogHeader>
                    <div className="h-10"></div>
                    <div className="w-full  flex items-center justify-center">
                        <a href={`/dashboard/settings/playground?name=${thisModel}&api=unieinfea&token=sk-BKRK89BCFLAQPEY_lpG_i9wFcuvOZ6jjcqJ5pzqzHJZRB7pImJHfU6dM1u8`}>
                        <Button  className="">Try it on <span className="text-blue-600 font-bold flex gap-1 items-center"><BotMessageSquare className="size-4" /> AI Playground ~</span></Button>
                        </a>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>

    );
}
