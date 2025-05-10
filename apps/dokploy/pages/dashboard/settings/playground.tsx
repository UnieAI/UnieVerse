import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { appRouter } from "@/server/api/root";
import { getLocale, serverSideTranslations } from "@/utils/i18n";
import { validateRequest } from "@dokploy/server";
import { createServerSideHelpers } from "@trpc/react-query/server";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";
import superjson from "superjson";

import { useState, useEffect, useRef, FocusEvent, ChangeEvent, KeyboardEvent, useMemo } from 'react'
import { AutoResizeTextarea } from "@/components/ui/autoResizeTextareaProps";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider";
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Send, Code } from 'lucide-react'
import { useIsMobile } from "@/hooks/use-mobile";

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

    const isMobile = useIsMobile();

    // https://api.exp.unieai.com
    const [apiUrl, setApiUrl] = useState<string>("https://api2.unieai.com");
    // sk-XnbHbzBOmPYGHgL_jLpgcJNSnog78lNayG2CVU5O0MDQ4iVZ_u4XLhva1Dc
    const [apiToken, setApiToken] = useState<string>("sk-ZpMqU0NAXCmiwYF_krHGFjN5kmmlhc1BBcYuYZO2NKcBh-l1l4NZb6MGusI");
    const [models, setModels] = useState<any>([]);
    const [model, setModel] = useState<string>("");

    // 壓測數量
    const [parallelCount, setParallelCount] = useState<number>(1);
    const [parallelMessages, setParallelMessages] = useState<any>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isReplying, setIsReplying] = useState<boolean>(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    const [message, setMessage] = useState<string>("");

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
        if (!message.trim() || isLoading || isReplying || !apiUrl || !apiToken) {
            toast.error("Invalid state or empty message.");
            return;
        }

        setIsLoading(true);
        setIsReplying(true);
        const toastId = toast.loading("Running parallel requests...");

        // 初始化或更新每組對話紀錄
        let baseUserMessage = { role: "user", content: message };
        let baseAssistantLoading = { role: "assistant", content: "loading", loading: true };

        let newParallelMessages: any = [];

        if (parallelMessages.length === 0) {
            // 初始建立 N 組
            newParallelMessages = Array.from({ length: parallelCount }, () => [
                baseUserMessage,
                baseAssistantLoading,
            ]);
        } else {
            // 延續每組對話
            newParallelMessages = parallelMessages.map(conv => [
                ...conv,
                baseUserMessage,
                baseAssistantLoading,
            ]);
        }

        // ✅ 同步更新狀態
        setParallelMessages(newParallelMessages);


        // 並行處理每組 stream
        await Promise.all(
            Array.from({ length: parallelCount }).map(async (_, index) => {
                try {
                    const controller = new AbortController();

                    // 取得過往訊息（去除 loading 和 system）
                    const history = (newParallelMessages[index] || []).filter(
                        (m: any) => m.role !== "system" && !m.loading
                    );

                    // 插入 system prompt（如果有）
                    const messages = modelParams.system_prompt?.trim()
                        ? [{ role: "system", content: modelParams.system_prompt }, ...history]
                        : history;

                    const payload = JSON.stringify({
                        model,
                        messages,
                        ...modelParams,
                        stream: true,
                    });

                    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiToken}`,
                        },
                        body: payload,
                        signal: controller.signal,
                    });

                    if (!response.body) throw new Error("No response stream");

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let partialContent = "";

                    // 替換 loading，插入空 assistant response
                    setParallelMessages(prev => {
                        const newState = [...prev];
                        const conv = [...newState[index]];
                        conv[conv.length - 1] = { role: "assistant", content: "" };
                        newState[index] = conv;
                        return newState;
                    });

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        partialContent += decoder.decode(value, { stream: true });
                        const lines = partialContent.split("\n");
                        partialContent = lines.pop() || "";

                        for (const line of lines) {
                            if (!line.trim() || line.trim() === "data: [DONE]") continue;
                            if (line.startsWith("data: ")) {
                                try {
                                    const json = JSON.parse(line.slice(6));
                                    const delta = json.choices?.[0]?.delta?.content;
                                    if (delta) {
                                        setParallelMessages(prev => {
                                            const newState = [...prev];
                                            const conv = [...newState[index]];
                                            const last = conv[conv.length - 1];
                                            if (last.role === "assistant") {
                                                conv[conv.length - 1] = {
                                                    ...last,
                                                    content: last.content + delta
                                                };
                                                newState[index] = conv;
                                            }
                                            return newState;
                                        });
                                    }
                                } catch (e) {
                                    console.warn("Stream JSON parse error", e);
                                }
                            }
                        }
                    }

                } catch (err) {
                    console.error("Stream error", err);
                    setParallelMessages(prev => {
                        const newState = [...prev];
                        const conv = [...newState[index]];
                        conv[conv.length - 1] = {
                            role: "assistant",
                            content: "Error occurred during response."
                        };
                        newState[index] = conv;
                        return newState;
                    });
                }
            })
        );

        setIsLoading(false);
        setIsReplying(false);
        setMessage("");
        toast.dismiss(toastId);
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
        setParallelMessages([]);
        setMessage('');
        setIsLoading(false);
        setIsReplying(false);
    };

    return (
        <div className="flex h-[90vh] gap-4 w-full overflow-hide">
            <div className=" w-full flex flex-col flex-1 border-r border-zinc-200 dark:border-zinc-800 p-4">

                <div className="flex flex-1 flex-row">
                    {parallelMessages.map((msgs, i) => (
                        <div className="relative flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            <MessageRender key={i} messages={msgs} />
                        </div>
                    ))}
                </div>

                <div className="relative mt-4 w-full flex justify-center items-end">
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
                    <button
                        onClick={handleSubmit}
                        disabled={!message.trim() || isLoading || isReplying}
                        className="absolute bottom-2 right-2 flex items-center justify-center"
                    >
                        <Send className="w-4 h-4 dark:text-zinc-200 hover:opacity-50" />
                    </button>
                </div>
            </div>

            {!isMobile && <div className="w-96 p-4 space-y-6 overflow-auto">

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

                <div className="space-y-2">
                    <label className="text-sm">Parallel Instances</label>
                    <input
                        type="number"
                        min={1}
                        max={30}
                        value={parallelCount}
                        onChange={(e) => setParallelCount(Number(e.target.value))}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950"
                    />
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
            </div>}
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

// --- Eric Components --- //

interface MessageRenderProps {
    messages: any;
}

const MessageRender = ({ messages }: MessageRenderProps) => {
    return (
        <>
            {
                messages.map((message, index) => (
                    <motion.div
                        key={index}
                        className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {message.role === 'assistant' && (
                            <div className="border rounded-full h-8 w-8 flex items-center justify-center">
                                <UnieAISVG className='text-blue-500 h-6 w-6' />
                            </div>
                        )}
                        <div
                            className={`px-4 py-2 max-w-[80%]`}
                            style={{
                                backgroundColor: message.role === 'user'
                                    ? (document.documentElement.classList.contains('dark') ? '#52525b' : '#e4e4e7')
                                    : '',
                                color: message.role === 'user'
                                    ? ''
                                    : 'white',
                                borderRadius: '0.5rem',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {(message.content === "loading" && message.loading) ? (
                                <div className='flex flex-row'>
                                    <WaveLoading />
                                </div>
                            ) : (
                                <RenderedResult content={message.content} />
                            )}
                        </div>
                    </motion.div>
                ))
            }
        </>
    )
}

interface RenderedResultProp {
    content: string;
}
const RenderedResult = ({ content }: RenderedResultProp) => {
    const renderedResult = useMemo(() => {
        return renderResultWithMedia(content);
    }, [content]);

    return (
        <>{renderedResult}</>
    )
}

const WaveLoading = () => {
    return (
        <div className="flex items-center justify-center space-x-1">
            {[0, 1, 2].map((index) => (
                <motion.span
                    key={index}
                    className="w-1 h-1 bg-current"
                    style={{ borderRadius: '9999px' }}
                    animate={{
                        y: ['0%', '-80%', '0%']
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatType: 'loop',
                        ease: 'easeInOut',
                        delay: index * 0.2
                    }}
                >
                </motion.span>
            ))}
        </div>
    );
};

const renderResultWithMedia = (text: string) => {
    // 定義正則來匹配各種 Markdown 語法
    const imgRegex = /!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/gi; // 匹配 ![任意值](URL)
    const videoRegex = /\[(video)\]\((https?:\/\/[^\s\)]+)\)/gi; // 匹配 [video](URL)
    const linkRegex = /\[(link)\]\((https?:\/\/[^\s\)]+)\)/gi; // 匹配 [link](URL)
    const otherMarkdownRegex = /\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/gi; // 匹配 [任意值](URL)（不包括上面的特定標籤）

    // 匹配這些標籤的組合正則
    const combinedRegex = new RegExp(
        `${imgRegex.source}|${videoRegex.source}|${linkRegex.source}|${otherMarkdownRegex.source}`,
        'gi'
    );

    const resultElements = [];
    let lastIndex = 0;
    let match;

    // 將所有的 [文字] 和 (鏈接) 替換為對應的 React 組件
    while ((match = combinedRegex.exec(text)) !== null) {
        // 先插入匹配之前的純文字
        if (lastIndex < match.index) {
            resultElements.push(
                <TextComponent text={text.slice(lastIndex, match.index)} key={lastIndex} />
            );
        }

        // 處理圖片
        if (match[0].startsWith('![')) {
            const imgMatch = match[0].match(/\((https?:\/\/[^\s\)]+)\)/);
            if (imgMatch) {
                const imgUrl = imgMatch[1];
                resultElements.push(
                    <ImageComponent key={imgUrl} url={normalizeUrl(imgUrl)} />
                );
            }
        }
        // 處理影片
        else if (/\[video\]/i.test(match[0])) {
            const videoMatch = match[0].match(/\((https?:\/\/[^\s\)]+)\)/);
            if (videoMatch) {
                const videoUrl = videoMatch[1];
                resultElements.push(
                    <VideoComponent key={videoUrl} url={normalizeUrl(videoUrl)} />
                );
            }
        }
        // 處理超連結
        else if (/\[link\]/i.test(match[0])) {
            const linkMatch = match[0].match(/\((https?:\/\/[^\s\)]+)\)/);
            if (linkMatch) {
                const linkUrl = linkMatch[1];
                resultElements.push(
                    <LinkComponent key={linkUrl} url={normalizeUrl(linkUrl)} />
                );
            }
        }
        // 處理其他連結
        else {
            const otherMatch = match[0].match(/\((https?:\/\/[^\s\)]+)\)/);
            if (otherMatch) {
                const otherUrl = otherMatch[1];
                resultElements.push(
                    <LinkComponent key={otherUrl} url={normalizeUrl(otherUrl)} />
                );
            }
        }

        // 更新 lastIndex 以處理下一段文字
        lastIndex = combinedRegex.lastIndex;
    }

    // 插入最後剩餘的文字
    if (lastIndex < text.length) {
        resultElements.push(
            <TextComponent text={text.slice(lastIndex)} key={lastIndex} />
        );
    }

    return <div>{resultElements}</div>;
};

const TextComponent = ({ text }: { text: string }) => {
    const parseMarkdown = (markdown: string) => {
        let html = markdown;

        // 先檢查是否有未封閉的 <think>
        const hasUnclosedThink = /<think>/.test(html) && !/<\/think>/.test(html);
        if (hasUnclosedThink) {
            html = html.replace(/<think>/, '<think>') + '</think>'; // 強制補上閉合
        }

        // 標記 think 區塊
        html = html.replace(/<think>([\s\S]*?)<\/think>/g, (match, content) => {
            return `[[THINK_START]]${content}[[THINK_END]]`;
        });

        // Markdown 處理
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
        html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
        html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
        html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');

        return html;
    };

    const parsedText = parseMarkdown(
        text.split('\n')
            .filter(line => line.trim() !== '')
            .join('\n')
    );

    // 用正則拆分出 think 區塊與普通文字
    const parts = parsedText.split(/(\[\[THINK_START\]\][\s\S]*?\[\[THINK_END\]\])/g);

    return (
        <div>
            {parts.map((part, index) => {
                if (part.startsWith('[[THINK_START]]')) {
                    const content = part.replace('[[THINK_START]]', '').replace('[[THINK_END]]', '');
                    return <ThinkBlock key={index} content={content} />;
                } else {
                    return (
                        <div
                            key={index}
                            dangerouslySetInnerHTML={{ __html: part }}
                        />
                    );
                }
            })}
        </div>
    );
};

// 思考區塊元件
const ThinkBlock = ({ content }: { content: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm opacity-40 hover:opacity-60"
            >
                {isOpen ? 'close ▲' : 'think ▼'}
            </button>
            {isOpen && (
                <div
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )}
        </div>
    );
};

// 圖片組件
const ImageComponent = ({ url }: { url: string }) => {
    return (
        <div className="relative block">
            <img
                src={url}
                alt="Image"
                className="max-w-full h-auto rounded-md shadow-md my-2 transform transition-transform-opacity duration-300 hover:scale-105"
                onClick={() => copyImageLink(url)}
            />
        </div>
    );
};

// 影片組件
const VideoComponent = ({ url }: { url: string }) => {
    if (url.startsWith('https://www.youtube.')) {
        if (url.startsWith('https://www.youtube.com/watch?v=')) {
            // 正常處理 YouTube 影片嵌入
            const videoId = new URL(url).searchParams.get('v');
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            return (
                <div className="relative block">
                    <iframe
                        className="max-w-full h-auto rounded-md shadow-md my-2 transform transition-transform-opacity duration-300 hover:scale-105"
                        src={embedUrl}
                        allowFullScreen
                    >

                    </iframe>
                </div>
            );
        } else {
            // 不是 watch?v=，應該顯示為連結
            return <LinkComponent url={url} />;
        }
    } else if (url.startsWith('https://www.instagram.')) {
        // ig 則顯示為連結
        return <LinkComponent url={url} />;
    } else if (url.startsWith('https://www.nicovideo.jp/watch/')) {
        // 處理 niconico 影片嵌入
        const videoId = url.split('/watch/')[1];
        const embedUrl = `https://embed.nicovideo.jp/watch/${videoId}?autoplay=0`;
        return (
            <div style={{ left: 0, width: '100%', height: 0, position: 'relative', paddingBottom: '56.25%' }}>
                <iframe
                    src={embedUrl}
                    style={{ top: 0, left: 0, width: '100%', height: '100%', position: 'absolute', border: 0 }}
                    allowFullScreen
                    scrolling="no"
                    allow="encrypted-media"
                ></iframe>
            </div>
        );
    } else {
        // 其他連結，正常嵌入
        return (
            <div className="relative block">
                <iframe
                    className="max-w-full h-auto rounded-md shadow-md my-2"
                    src={url}
                    allowFullScreen
                >

                </iframe>
            </div>
        );
    }
};

// 連結組件
const LinkComponent = ({ url }: { url: string }) => {

    // 如果是 YouTube 的影片連結，應該顯示 VideoComponent
    if (url.startsWith('https://www.youtube.com/watch?v=') ||
        url.startsWith('https://www.nicovideo.jp/watch/')
    ) {
        return <VideoComponent url={url} />;
    }

    // 其餘連結顯示為按鈕
    return (
        <button
            onClick={() => window.open(url, '_blank')}
            className="hover:underline my-1"
        >
            Link
        </button>
    );
};

// 複製圖片 URL 函數
const copyImageLink = (url: string) => {
    navigator.clipboard.writeText(url)
        .then(() => {
            alert("Image link has been copied to the clipboard!");
        })
        .catch((err) => {
            console.error("Image link copy failed!", err);
        });
};

function normalizeUrl(url: string) {
    const httpCheck = normalizeHttpUrl(url);
    const youtubeCheck = normalizeYouTubeUrl(httpCheck);
    return youtubeCheck;
}

function normalizeHttpUrl(url: string) {
    return decodeURIComponent(url.startsWith('http:') ? url.replace('http:', 'https:') : url);
}

function normalizeYouTubeUrl(url: string) {
    let _url = decodeURIComponent(url.startsWith('https://youtube.') ? url.replace('https://youtube.', 'https://www.youtube.') : url);
    _url = decodeURIComponent(_url.startsWith('https://m.youtube.') ? _url.replace('https://m.youtube.', 'https://www.youtube.') : _url);
    _url = decodeURIComponent(_url.startsWith('https://www.youtube.com/watch?app=desktop&v=') ? _url.replace('https://www.youtube.com/watch?app=desktop&v=', 'https://www.youtube.com/watch?v=') : _url);

    if (!url.startsWith('https://www.youtube.')) {
        _url = decodeURIComponent(url); // 將原始 URL 進行解碼
    }
    return _url;
}

const UnieAISVG = (
    { className }: { className?: string }
) => {
    return (
        <svg
            className={`${className} fill-current`}
            version="1.1"
            id="_圖層_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 499.28 444.55"
            xmlSpace="preserve"
        >
            <path
                className="uuid-9652422c-9824-4901-a3f6-837eb0813328"
                d="m496.58,432.3c-7.44-13.21-219.4-145.81-455.36-17.82,0,0-3.98-2.73,6.18-10.69,9.96-7.86,49.58-32.18,124.43-55.66,74.74-26.21,149.17-29.56,177.26-130.4,58.7,18.55,86.06,48.64,84.7,63.21-1.68,16.98-18.34,26.73-29.98,31.66-11.01,4.72-17.09,7.86-15.51,11.43,2.73,5.87,59.02,9.43,70.23-41.83,4.51-46.86-64.15-80.82-108.39-90.57C356.01,4.82,176.23,0,176.23,0c-26.42,126,59.44,196.86,146.65,212.58,0,0-14.68,52.2-64.78,82.5C199.82,330.2,51.8,331.98.65,432.3c-2.52,5.03,1.57,15.62,24.74,7.34,284.39-108.07,443.93.73,461.54,4.19,9.01,1.78,16.67,1.05,9.54-11.53h.1ZM199.92,28.62s132.18,22.54,125.58,159.54c0,0-124.74-11.95-125.58-159.54Z"
            />
        </svg>
    );
};

