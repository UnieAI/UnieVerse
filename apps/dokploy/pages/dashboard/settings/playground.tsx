import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { appRouter } from "@/server/api/root";
import { getLocale, serverSideTranslations } from "@/utils/i18n";
import { validateRequest } from "@dokploy/server";
import { createServerSideHelpers } from "@trpc/react-query/server";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";
import superjson from "superjson";

import { useState, useEffect, useRef, useMemo } from "react"
import { AutoResizeTextarea } from "@/components/ui/AutoResizeTextareaProps";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider";
import { toast } from 'sonner'
import { Send, Code } from 'lucide-react'

interface Message {
    role: "system" | "user" | "assistant"
    content: string
}

interface ModelParams {
    temperature: number
    max_tokens: number
    top_p: number
    top_k: number
    presence_penalty: number
    frequency_penalty: number
    system_prompt: string
    context_length_exceeded_behavior: string
    echo: boolean
}

const Page = () => {

    const [apiUrl, setApiUrl] = useState<string>("https://api2.unieai.com");
    const [apiToken, setApiToken] = useState<string>("sk-ZpMqU0NAXCmiwYF_krHGFjN5kmmlhc1BBcYuYZO2NKcBh-l1l4NZb6MGusI");
    const [models, setModels] = useState<any>([]);
    const [model, setModel] = useState<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isReplying, setIsReplying] = useState<boolean>(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    
    const [message, setMessage] = useState<string>("");
    const [messages, setMessages] = useState<any>([]);
    const [modelParams, setModelParams] = useState<ModelParams>({
        temperature: 0.6,
        max_tokens: 4096,
        top_p: 1,
        top_k: 40,
        presence_penalty: 0,
        frequency_penalty: 0,
        system_prompt: "",
        context_length_exceeded_behavior: "none",
        echo: false
    });

    const handleRefreshModels = async () => {
        if (!apiUrl || !apiToken) {
            toast.error("Please enter both API URL and Token.");
            return;
        }

        if (isLoading || isReplying) {
            toast.error(`please wait...`);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`${apiUrl}/v1/models`, {
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${apiToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`API call failed with status ${response.status}`);
            }

            const data = await response.json();
            const modelIds = data.data.map((m: any) => m.id); // 提取 id
            setModels(modelIds);
            toast.success("Models fetched successfully!");
        } catch (err: any) {
            toast.error("Failed to fetch models: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async () => {
        if (!message.trim()) return;

        if (!apiUrl || !apiToken) {
            toast.error("Please enter both API URL and Token.");
            return;
        }

        if (isLoading || isReplying) {
            toast.error(`Generating response, please wait...`);
            return;
        }

        const newMessages = [
            ...messages,
            { role: "user", content: message },
        ];

        setMessages(newMessages);
        setMessage("");

        setIsLoading(true);
        setIsReplying(true);

        const toastId = toast.loading(`Generating response...`);

        // Add a temporary loading message
        setMessages(prev => [...prev, { role: 'assistant', content: 'loading', loading: true }]);

        try {
            abortControllerRef.current = new AbortController();

            const payload = JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: modelParams.system_prompt },
                    ...newMessages,
                ],
                max_tokens: modelParams.max_tokens,
                temperature: modelParams.temperature,
                top_p: modelParams.top_p,
                top_k: modelParams.top_k,
                presence_penalty: modelParams.presence_penalty,
                frequency_penalty: modelParams.frequency_penalty,
                echo: modelParams.echo,
                stream: true,
            });

            // 流式處理邏輯
            const url = `${apiUrl}/v1/chat/completions`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiToken}`,
                },
                body: payload,
                signal: abortControllerRef.current.signal,
            });

            if (!response.body) {
                throw new Error("No response body from streaming API");
            }

            const reader = response.body?.getReader();
            let partialResponse = '';

            if (reader) {

                // Remove the temporary loading message
                setMessages(prev => prev.slice(0, -1));

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        // Process any remaining response content
                        if (partialResponse.trim()) {
                            try {
                                const lines = partialResponse.split('\n');
                                const lastMessage = lines
                                    .filter(line => line.startsWith('data: '))
                                    .map(line => JSON.parse(line.slice(6)))
                                    .pop();

                                if (lastMessage?.choices?.[0]?.delta?.content) {
                                    setMessages(prev => {
                                        const lastMsg = prev[prev.length - 1];
                                        if (lastMsg?.role === 'assistant') {
                                            return [
                                                ...prev.slice(0, -1),
                                                { ...lastMsg, content: lastMsg.content + lastMessage.choices[0].delta.content },
                                            ];
                                        } else {
                                            return [...prev, { role: 'assistant', content: lastMessage.choices[0].delta.content }];
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('Error parsing final JSON:', e);
                            }
                        }
                        break;
                    }

                    const chunk = new TextDecoder().decode(value);
                    partialResponse += chunk;

                    let lines = partialResponse.split('\n');
                    // 只保留最後 incomplete 的那一行
                    partialResponse = lines.pop() ?? "";

                    lines = lines.filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line === "data: [DONE]") {
                            // "[DONE]" 是特殊結束符，忽略它
                            // console.log("Stream finished.");
                            continue;
                        }
                        if (line.startsWith('data: ')) {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                if (parsed.choices?.[0]?.delta?.content) {
                                    const content = parsed.choices[0].delta.content;
                                    setMessages(prev => {
                                        const lastMsg = prev[prev.length - 1];
                                        if (lastMsg?.role === 'assistant') {
                                            return [
                                                ...prev.slice(0, -1),
                                                { ...lastMsg, content: lastMsg.content + content },
                                            ];
                                        } else {
                                            return [...prev, { role: 'assistant', content }];
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('Error parsing JSON:', e);
                                console.error('Problematic line:', line);
                            }
                        } else {
                            // console.warn('Ignored non-data line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error:", error);
            // Remove the temporary loading message in case of error
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
            setIsReplying(false);
            toast.dismiss(toastId);
            abortControllerRef.current = null;
        }
    };

    const stopReply = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsReplying(false);
            setIsLoading(false);
        }
    };

    const startNewChat = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setMessages([]);
        setMessage('');
        setIsLoading(false);
        setIsReplying(false);
    };

    const renderMessage = (msg: Message, index: number) => (
        <div key={index} className={`p-4 ${msg.role === "user" ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"} rounded-lg mb-4`}>
            <div className="font-semibold mb-2">{msg.role === "user" ? "You" : "Assistant"}</div>
            <div className="text-zinc-600 dark:text-zinc-300">{msg.content}</div>
        </div>
    );

    return (
        <div className="flex gap-4 w-full">
            <div className=" w-full flex-1 border-r border-zinc-200 dark:border-zinc-800 p-4">

                <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-6 mb-4 overflow-y-auto">
                    {messages.map(renderMessage)}
                </div>

                <div className="flex items-center gap-2 w-full">
                    <AutoResizeTextarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (e.shiftKey) {
                                    // Shift+Enter 換行
                                    return;
                                } else {
                                    // Enter 送出訊息
                                    e.preventDefault(); // 防止預設換行
                                    handleSubmit();     // 送出訊息
                                }
                            }
                        }}
                        placeholder="Type a message"
                        className="flex-1 h-12 px-4 py-2 border border-zinc-300 rounded-md"
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={!message.trim() || isLoading || isReplying}
                        className="h-12 px-4 bg-blue-600 hover:bg-blue-800 text-white rounded-md flex items-center justify-center"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="w-96 p-4 space-y-6 overflow-auto">

                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">options</h3>
                </div>

                <div className="space-y-2">
                    <label className="text-sm">API URL</label>
                    <input
                        type="text"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        placeholder="https://your-api.com"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950"
                    />

                    <label className="text-sm">API Token</label>
                    <input
                        type="password"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder="sk-xxxx"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950"
                    />

                    <Button
                        onClick={() => handleRefreshModels()}
                        className="w-full bg-blue-600 hover:bg-blue-800 text-white"
                        disabled={isLoading || isReplying}
                    >
                        Refresh Models
                    </Button>
                </div>

                <div className="space-y-2">
                    <label className="text-sm">Select Model</label>
                    <select
                        className="w-full p-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    >
                        <option value="" disabled>Select a model</option>
                        {models.map((id: string) => (
                            <option key={id} value={id}>{id}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm">Temperature</label>
                            <Badge variant="secondary">{modelParams.temperature}</Badge>
                        </div>
                        <Slider
                            value={[modelParams.temperature]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, temperature: value }))}
                            max={1}
                            step={0.1}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm">Max Tokens</label>
                            <Badge variant="secondary">{modelParams.max_tokens}</Badge>
                        </div>
                        <Slider
                            value={[modelParams.max_tokens]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, max_tokens: value }))}
                            max={8000}
                            step={1}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm">Top P</label>
                            <Badge variant="secondary">{modelParams.top_p}</Badge>
                        </div>
                        <Slider
                            value={[modelParams.top_p]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, top_p: value }))}
                            max={1}
                            step={0.1}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm">Top K</label>
                            <Badge variant="secondary">{modelParams.top_k}</Badge>
                        </div>
                        <Slider
                            value={[modelParams.top_k]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, top_k: value }))}
                            max={100}
                            step={1}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm">Presence Penalty</label>
                            <Badge variant="secondary">{modelParams.presence_penalty}</Badge>
                        </div>
                        <Slider
                            value={[modelParams.presence_penalty]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, presence_penalty: value }))}
                            max={2}
                            step={0.1}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm">Frequency Penalty</label>
                            <Badge variant="secondary">{modelParams.frequency_penalty}</Badge>
                        </div>
                        <Slider
                            value={[modelParams.frequency_penalty]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, frequency_penalty: value }))}
                            max={2}
                            step={0.1}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm">System Prompt</label>
                        <AutoResizeTextarea
                            value={modelParams.system_prompt}
                            onChange={(e) => setModelParams(prev => ({ ...prev, system_prompt: e.target.value }))}
                            placeholder={"enter a system prompt..."}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm">Context Length Exceeded Behavior</label>
                        <select
                            className="w-full mt-1 p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                            value={modelParams.context_length_exceeded_behavior}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                                setModelParams(prev => ({ ...prev, context_length_exceeded_behavior: event.target.value }))
                            }}
                        >
                            <option value="none">None</option>
                            <option value="truncate">Truncate</option>
                            <option value="error">Error</option>
                        </select>
                    </div>

                    <div className="flex flex-row items-center gap-2">
                        <>
                            <Checkbox
                                id="echo"
                                checked={modelParams.echo}
                                onCheckedChange={(checked) => setModelParams(prev => ({ ...prev, echo: checked as boolean }))}
                            />
                            <label htmlFor="echo" className="text-sm">Echo</label>
                        </>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;

Page.getLayout = (page: ReactElement) => {
    return <DashboardLayout>{page}</DashboardLayout>;
};
export async function getServerSideProps(
    ctx: GetServerSidePropsContext<{ serviceId: string }>,
) {
    const { req, res } = ctx;
    const { user, session } = await validateRequest(req);
    const locale = getLocale(req.cookies);

    const helpers = createServerSideHelpers({
        router: appRouter,
        ctx: {
            req: req as any,
            res: res as any,
            db: null as any,
            session: session as any,
            user: user as any,
        },
        transformer: superjson,
    });

    await helpers.settings.isCloud.prefetch();

    await helpers.user.get.prefetch();

    if (!user || user.role === "member") {
        return {
            redirect: {
                permanent: true,
                destination: "/",
            },
        };
    }
    return {
        props: {
            trpcState: helpers.dehydrate(),
            ...(await serverSideTranslations(locale, ["settings"])),
        },
    };
}
