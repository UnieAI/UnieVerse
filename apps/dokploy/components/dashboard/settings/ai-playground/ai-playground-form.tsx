"use client";

import React, { useState, useEffect, useRef } from 'react'
import { api } from "@/utils/api";
import { AutoResizeTextarea } from "@/components/ui/autoResizeTextareaProps";
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { PanelRight, Send, CircleStop } from 'lucide-react'
import { useIsMobile } from "@/hooks/use-mobile";

import { isDevelopment, PLAYGROUND_TAB_VALUE, UNIEINFRA_OPENAI_API_URL } from "@/utils/unieai/unieinfra/key";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

import { Message, ModelParams, _defaultModelParams } from ".";

import { AiPlaygroundSidebar } from "./ai-playground-sidebar";
import { AiPlaygroundMessageRender } from "./ai-playground-message-render";

export const AiPlaygroundForm = () => {

    const isMobile: boolean = useIsMobile();

    const [isOpenOptions, setIsOpenOptions] = useState<boolean>(true);

    const [currentApiType, setCurrentApiType] = useState<string>(PLAYGROUND_TAB_VALUE.UNIEINFRA);

    const {
        accessToken,
        tokens, getTokens,
    } = useUnieInfra();

    const { data: aiThirdPartyConfigs, refetch: refetchAiThirdParty, isLoading: isLoadingAiThirdParty } = api.aiThirdParty.getAll.useQuery();

    const [apiUrl, setApiUrl] = useState<string>("");
    const [apiToken, setApiToken] = useState<string>("");
    const [models, setModels] = useState<string[]>([]);

    // 預設 model
    const [defaultModel, setDefaultModel] = useState<string>("");
    // 預設 llm api 參數
    const [defaultModelParams, setDefaultModelParams] = useState<ModelParams>(_defaultModelParams);

    // 嘗試取得前端瀏覽器最大併發數量
    const [maxConcurrency, setMaxConcurrency] = useState(0);

    // 壓測數量
    const maxCount = 30;
    const [parallelCount, setParallelCount] = useState<number>(1); // 實際值
    const [tempParallelCount, setTempParallelCount] = useState<number>(1); // 暫存輸入值

    // 選擇顯示的對話串
    const [maxSelectIndex, setMaxSelectIndex] = useState<number>(3); // 實際值
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([1]);

    // 儲存訊息
    const [parallelMessages, setParallelMessages] = useState<Message[]>([]);  // 每個 thread 的 Message list
    const [threadModels, setThreadModels] = useState<string[]>([]); // 每個 thread 可選自己的 model
    const [editParams, setEditParams] = useState<number>(0); // 編輯中的 id, default = 0;
    const [threadModelParams, setThreadModelParams] = useState<ModelParams[]>([]); // 每個 thread 的 llm api 參數

    // 狀態
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isReplying, setIsReplying] = useState<boolean>(false);

    // 中止串流
    const abortControllersRef = useRef<AbortController[]>([]);

    // 訊息暫存輸入值
    const [message, setMessage] = useState<string>("");

    const testConcurrency = async () => {
        setIsLoading(true);

        type Result = {
            requestSentTime: number;
            responseStartTime: number;
        };

        const results: Result[] = [];

        const requests = Array.from({ length: Math.min(maxCount, 30) }, (_, i) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                const requestSentTime = Date.now();

                img.onload = img.onerror = () => {
                    const responseStartTime = Date.now();
                    results.push({ requestSentTime, responseStartTime });
                    resolve();
                };

                img.src = `/api/unieai/dummy?i=${i}&t=${Date.now()}`;
            });
        });

        await Promise.all(requests);
        setIsLoading(false);

        // STEP 1: 依照 responseStartTime 排序
        results.sort((a, b) => a.responseStartTime - b.responseStartTime);

        // STEP 2: 在每個 responseStartTime 為中心，找 100ms 範圍內有幾筆 response 幾乎同時回來
        let maxCluster = 0;
        const clusterWindow = 250; // ms 範圍內算同一批

        for (let i = 0; i < results.length; i++) {
            const center = results[i]!.responseStartTime;
            const count = results.filter(r =>
                r.responseStartTime >= center &&
                r.responseStartTime < center + clusterWindow
            ).length;

            maxCluster = Math.max(maxCluster, count);
        }

        setMaxConcurrency(maxCluster);

        if (tempParallelCount > maxCluster)
            toast.warning(`You set ${tempParallelCount} parallel instances, but your browser's actual concurrency limit appears to be around ${maxCluster}.`);
        else
            toast.info(`Your browser handled ≥ ${maxCluster} concurrent requests. This likely reflects its actual concurrency limit.`);
    };

    const handleRefreshModels = async () => {

        if (!apiUrl || !apiToken) {
            toast.error("Please enter both API URL and Token.");
            setModels([]);
            return;
        }

        if (isLoading || isReplying) {
            toast.error(`please wait...`);
            setModels([]);
            return;
        }

        if (isDevelopment) console.log(`Try fetch models:\r\nurl:\r\n${apiUrl}/models\r\nauthorization:\r\nBearer ${apiToken}`);

        try {
            setIsLoading(true);
            const response = await fetch(`${apiUrl}/models`, {
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${apiToken}`,
                },
            });

            const result = await response.json();
            if (isDevelopment) console.log(`fetch models result:`, result);

            if (!response.ok) {
                throw new Error(`fetch models failed with status ${response.status}`);
            }

            const modelIds: string[] = result.data.map((m: any) => m.id); // 提取 id
            setModels(modelIds);
            toast.success("Models fetched successfully!");
        } catch (err: any) {
            setModels([]);
            toast.error("Failed to fetch models: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async () => {
        if (!apiUrl || !apiToken) {
            toast.error("Invalid api url or api token.");
            return;
        }

        if (threadModels.some(m => m === "") && defaultModel === "") {
            toast.error("At least one thread has no model selected, and no default model is set.");
            return;
        }


        if (isLoading || isReplying) {
            toast.error("Wait for loading or replying...");
            return;
        }

        if (!message.trim()) {
            toast.error("Empty message.");
            return;
        }

        setIsLoading(true);
        setIsReplying(true);
        const toastId = toast.loading("Running parallel requests...");

        // 初始化或更新每組對話紀錄
        let baseUserMessage = { role: "user", content: message };
        let baseAssistantLoading = { role: "assistant", content: "loading", loading: true, state: "pending" };

        let newParallelMessages: any = [];

        if (parallelMessages.length === 0) {
            // 初始建立 N 組
            newParallelMessages = Array.from({ length: parallelCount }, () => [
                baseUserMessage,
                baseAssistantLoading,
            ]);
        } else {
            // 延續每組對話
            newParallelMessages = parallelMessages.map((conv: any) => [
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
                    abortControllersRef.current[index] = controller;

                    // 取得過往訊息（去除 loading 和 system）
                    const history = (newParallelMessages[index] || []).filter(
                        (m: any) => m.role !== "system" && !m.loading
                    );

                    // 插入 system prompt（如果有）
                    const messages = defaultModelParams.system_prompt?.trim()
                        ? [{ role: "system", content: defaultModelParams.system_prompt }, ...history]
                        : history;

                    const payload = JSON.stringify({
                        model: threadModels[index] || defaultModel,
                        messages,
                        ...defaultModelParams,
                        stream: true,
                    });

                    // 紀錄開始串流時間
                    const requestTime = new Date().toISOString();

                    const response = await fetch(`${apiUrl}/chat/completions`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiToken}`,
                        },
                        body: payload,
                        signal: controller.signal,
                    });

                    if (!response.ok) {
                        const errorJson = await response.json();
                        throw new Error(errorJson.error?.message || "Request failed");
                    }

                    if (!response.body) throw new Error("No response stream");

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let partialContent = "";

                    // 替換 loading，插入空 assistant response
                    setParallelMessages((prev: any) => {
                        const newState = [...prev];
                        const conv = [...newState[index]];
                        conv[conv.length - 1] = {
                            role: "assistant",
                            content: "",
                            requestTime: requestTime,
                            state: "pending",
                        };
                        newState[index] = conv;
                        return newState;
                    });

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            setParallelMessages((prev: any) => {
                                const newState = [...prev];
                                const conv = [...newState[index]];
                                const last = conv[conv.length - 1];
                                if (last.role === "assistant") {
                                    conv[conv.length - 1] = {
                                        ...last,
                                        state: "complete",
                                    };
                                    newState[index] = conv;
                                }
                                return newState;
                            });
                            break;
                        }


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
                                        const now = Date.now(); // 當前時間（毫秒）
                                        const responseTime = new Date(); // 紀錄結束串流時間
                                        setParallelMessages((prev: any) => {
                                            const newState = [...prev];
                                            const conv = [...newState[index]];
                                            const last = conv[conv.length - 1];
                                            if (last.role === "assistant") {
                                                conv[conv.length - 1] = {
                                                    ...last,
                                                    content: last.content + delta,
                                                    responseStartTime: last.responseStartTime ? last.responseStartTime : responseTime.toISOString(),
                                                    responseEndTime: responseTime.toISOString(),
                                                    durationMs: now - new Date(last.responseStartTime).getTime(),
                                                    state: "streaming",
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

                } catch (err: any) {
                    const responseTime = new Date(); // 紀錄結束串流時間
                    if (err.name === 'AbortError') {
                        toast.success("Stop streaming.");

                        setParallelMessages((prev: any) => {
                            const newState = [...prev];
                            const conv = [...newState[index]];
                            const last = conv[conv.length - 1];
                            if (last.role === "assistant") {
                                if (last.content === "loading" && last?.loading === true) {
                                    conv[conv.length - 1] = {
                                        role: "assistant",
                                        content: "",
                                        responseEndTime: responseTime.toISOString(),
                                        state: "abort",
                                    };
                                    newState[index] = conv;
                                } else {
                                    conv[conv.length - 1] = {
                                        ...last,
                                        role: "assistant",
                                        responseEndTime: responseTime.toISOString(),
                                        state: "abort",
                                    };
                                    newState[index] = conv;
                                }
                            }
                            return newState;
                        });
                    }
                    else {
                        toast.error("Streaming error: ", err);

                        setParallelMessages((prev: any) => {
                            const newState = [...prev];
                            const conv = [...newState[index]];
                            const last = conv[conv.length - 1];
                            if (last.role === "assistant") {
                                conv[conv.length - 1] = {
                                    ...last,
                                    role: "assistant",
                                    content: "Error occurred during response.",
                                    responseEndTime: responseTime.toISOString(),
                                    state: "error",
                                };
                                newState[index] = conv;
                            }
                            return newState;
                        });
                    }
                }
            })
        );

        setIsLoading(false);
        setIsReplying(false);
        setMessage("");
        toast.dismiss(toastId);
    };

    function abortControllers() {
        abortControllersRef.current.forEach((controller) => {
            controller.abort();
        });
        abortControllersRef.current = [];
    };

    function handleStopReply() {
        abortControllers();
        setIsReplying(false);
        setIsLoading(false);
    };

    function resetThreads() {
        setThreadModels(() => {
            let newModelParams: string[] = [];

            // 補足長度
            while (newModelParams.length < parallelCount) {
                newModelParams.push("");
            }

            return newModelParams;
        });

        setThreadModelParams(() => {
            let newModelParams: ModelParams[] = [];

            // 補足長度
            while (newModelParams.length < parallelCount) {
                newModelParams.push(_defaultModelParams);
            }

            return newModelParams;
        });

        setDefaultModel("");
        setDefaultModelParams(_defaultModelParams);
    }

    function handleResetChatRoom(resetModelParams: boolean) {
        abortControllers();
        setParallelMessages([]);
        setMessage('');
        setIsLoading(false);
        setIsReplying(false);

        // 預設選擇 index [0,1,2] (最多 2~3 個)
        setSelectedIndexes(
            Array.from({ length: Math.min(maxSelectIndex, parallelCount) }, (_, i) => i)
        );

        // 預設選擇 0
        setEditParams(0);

        if (!resetModelParams) {
            setThreadModels((prev) => {
                let updated = [...prev];

                // 補足長度
                while (updated.length < parallelCount) {
                    updated.push("");
                }

                // 如果長度太長，刪除多餘的值
                if (updated.length > parallelCount) {
                    updated = updated.slice(0, parallelCount);
                }

                // 清除不存在於 models 的值
                for (let i = 0; i < updated.length; i++) {
                    if (updated[i] && !models.includes(updated[i]!)) {
                        updated[i] = "";
                    }
                }

                return updated;
            });

            setThreadModelParams((prev) => {
                let updated = [...prev];

                // 補足長度
                while (updated.length < parallelCount) {
                    updated.push(_defaultModelParams);
                }

                // 如果長度太長，刪除多餘的值
                if (updated.length > parallelCount) {
                    updated = updated.slice(0, parallelCount);
                }

                return updated;
            });
        } else {
            resetThreads();
        }
    };

    useEffect(() => {
        let currentIndex = isMobile ? 2 : 3;
        setMaxSelectIndex(currentIndex);
        // 預設選擇 index [0,1,2] (最多 2~3 個)
        setSelectedIndexes(
            Array.from({ length: Math.min(currentIndex, parallelCount) }, (_, i) => i)
        );
    }, [isMobile]);

    useEffect(() => {
        if (!isLoading && !isReplying) testConcurrency();

        handleResetChatRoom(false);
    }, [parallelCount]);

    useEffect(() => {
        const fetchUnieInfra = async () => {

            setApiUrl("");
            setApiToken("");

            if (currentApiType === PLAYGROUND_TAB_VALUE.AI) {

            }
            else if (currentApiType === PLAYGROUND_TAB_VALUE.UNIEINFRA) {
                setApiUrl(UNIEINFRA_OPENAI_API_URL);
                if (accessToken !== null) await getTokens(accessToken); // 重新嘗試取得 tokens
                if (tokens.length > 0) {
                    setApiToken(`sk-${tokens[0]?.key!}`);
                } else {
                    setModels([]);
                    toast.warning("No UnieInfra token exist, please create UnieInfra token first.")
                }
            } else if (currentApiType === PLAYGROUND_TAB_VALUE.THIRD_PARTY) {
                if (Array.isArray(aiThirdPartyConfigs) && aiThirdPartyConfigs.length > 0) {
                    const config = aiThirdPartyConfigs[0]!;
                    setApiUrl(config.apiUrl);
                    setApiToken(config.apiKey);
                } else {
                    toast.warning("No Third-Party token exist, please create Third-Party token first.");
                }

            } else if (currentApiType === PLAYGROUND_TAB_VALUE.TEST_API) {

            }
        };

        fetchUnieInfra();
    }, [currentApiType]);

    useEffect(() => {
        const fetchModels = async () => {
            if (apiUrl && apiToken) {
                if (currentApiType !== PLAYGROUND_TAB_VALUE.TEST_API) await handleRefreshModels();
            }
            else {
                setModels([]);
            }
        }
        if (isOpenOptions) fetchModels();
    }, [isOpenOptions, apiUrl, apiToken]);

    useEffect(() => {
        resetThreads();
    }, [models])

    return (
        <>
            <div className={`${isOpenOptions ? isMobile ? "hidden" : "w-3/4 px-4" : "w-full"} flex flex-col border-zinc-200 dark:border-zinc-800`}>
                <div className="flex flex-1 flex-row overflow-y-auto">
                    {selectedIndexes.map((index, idx) => (
                        <React.Fragment key={index}>
                            <div className="relative flex-1 p-4 overflow-auto">
                                <AiPlaygroundMessageRender thread={index + 1} messages={parallelMessages[index] || []} threadModels={threadModels} setThreadModels={setThreadModels} model={defaultModel} models={models} />
                            </div>
                            {idx < selectedIndexes.length - 1 && (
                                <div className={`w-px ${isMobile && "mx-2"} bg-zinc-100 dark:bg-zinc-900`} />
                            )}
                        </React.Fragment>
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
                        disabled={isLoading || isReplying}
                    />
                    {isReplying ? (
                        <button
                            onClick={handleStopReply}
                            className="absolute bottom-2 right-2 z-50 flex items-center justify-center"
                        >
                            <CircleStop className="w-4 h-4 dark:text-zinc-200 hover:opacity-50" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || isReplying}
                            className="absolute bottom-2 right-2 z-50 flex items-center justify-center"
                        >
                            <Send className="w-4 h-4 dark:text-zinc-200 hover:opacity-50" />
                        </button>
                    )}

                </div>
            </div>

            {/* options */}
            <AiPlaygroundSidebar
                currentApiType={currentApiType}
                setCurrentApiType={setCurrentApiType}
                isOpenOptions={isOpenOptions}
                isMobile={isMobile}
                isLoading={isLoading}
                isReplying={isReplying}
                // api settings
                apiUrl={apiUrl}
                setApiUrl={setApiUrl}
                apiToken={apiToken}
                setApiToken={setApiToken}
                handleRefreshModels={handleRefreshModels}
                models={models}
                setModels={setModels}
                // chat rooms
                handleResetChatRoom={handleResetChatRoom}
                maxCount={maxCount}
                maxSelectIndex={maxSelectIndex}
                parallelCount={parallelCount}
                setParallelCount={setParallelCount}
                tempParallelCount={tempParallelCount}
                setTempParallelCount={setTempParallelCount}
                threadModels={threadModels}
                setThreadModels={setThreadModels}
                parallelMessages={parallelMessages}
                // render msgs
                selectedIndexes={selectedIndexes}
                setSelectedIndexes={setSelectedIndexes}
                // default
                editParams={editParams}
                setEditParams={setEditParams}
                defaultModel={defaultModel}
                setDefaultModel={setDefaultModel}
                defaultModelParams={defaultModelParams}
                setDefaultModelParams={setDefaultModelParams}

            />

            <div className="absolute -top-12 right-0">
                <Button
                    data-sidebar="trigger"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsOpenOptions(!isOpenOptions)}
                >
                    <PanelRight />
                    <span className="sr-only">Options Sidebar</span>
                </Button>
            </div>
        </>
    );
};
