"use client";

import React, { useState, useEffect } from 'react'
import { AutoResizeTextarea } from "@/components/ui/autoResizeTextarea";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

import { ChevronUp, ChevronDown } from 'lucide-react';

import { isDevelopment, AI_PLAYGROUND_TAB_VALUE, AI_PLAYGROUND_TAB_KEYS } from "@/utils/unieai/unieinfra/key";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";
import { api } from "@/utils/api";

import { Message, ModelParams, _defaultModelParams } from ".";
import { calculateCharsPerSecond } from "./functions";

interface AiPlaygroundSidebarProps {
    currentApiType: string;
    handleApiOptionsTabChange: (apiTab: string) => Promise<void>;
    isOpenOptions: boolean;
    isMobile: boolean;
    isLoading: boolean;
    isReplying: boolean;
    // api settings
    apiUrl: string;
    setApiUrl: React.Dispatch<React.SetStateAction<string>>;
    apiToken: string;
    setApiToken: React.Dispatch<React.SetStateAction<string>>;
    handleRefreshModels: () => void;
    models: string[];
    setModels: React.Dispatch<React.SetStateAction<string[]>>;
    // chat rooms
    handleResetChatRoom: (resetModelParams: boolean) => void;
    maxCount: number;
    maxSelectIndex: number;
    parallelCount: number;
    setParallelCount: (value: React.SetStateAction<number>) => void;
    tempParallelCount: number;
    setTempParallelCount: (value: React.SetStateAction<number>) => void;
    threadModels: string[];
    setThreadModels: (value: React.SetStateAction<string[]>) => void;
    parallelMessages: Message[];
    // render msgs
    selectedIndexes: number[];
    setSelectedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
    // default
    editParams: number;
    setEditParams: React.Dispatch<React.SetStateAction<number>>;
    defaultModel: string;
    setDefaultModel: React.Dispatch<React.SetStateAction<string>>;
    defaultModelParams: ModelParams;
    setDefaultModelParams: React.Dispatch<React.SetStateAction<ModelParams>>;

}

export const AiPlaygroundSidebar = ({
    currentApiType,
    handleApiOptionsTabChange,
    isOpenOptions,
    isMobile,
    isLoading,
    isReplying,
    // api settings
    apiUrl,
    setApiUrl,
    apiToken,
    setApiToken,
    handleRefreshModels,
    models,
    setModels,
    // chat rooms
    handleResetChatRoom,
    maxCount,
    maxSelectIndex,
    parallelCount,
    setParallelCount,
    tempParallelCount,
    setTempParallelCount,
    threadModels,
    setThreadModels,
    parallelMessages,
    // render msgs
    selectedIndexes,
    setSelectedIndexes,
    // default
    editParams,
    setEditParams,
    defaultModel,
    setDefaultModel,
    defaultModelParams,
    setDefaultModelParams,

}: AiPlaygroundSidebarProps) => {

    const {
        tokens,
    } = useUnieInfra();

    const { data: aiThirdPartyConfigs, refetch: refetchAiThirdParty, isLoading: isLoadingAiThirdParty } = api.aiThirdParty.getAll.useQuery();

    const [isOpenChatRoomSettingsBtns, setIsOpenChatRoomSettingsBtns] = useState<boolean>(false);
    const [isOpenModelParamsBtns, setIsOpenModelParamsBtns] = useState<boolean>(false);
    const [isOpenLLMOtherParamsBtns, setIsOpenLLMOtherParamsBtns] = useState<boolean>(false);

    useEffect(() => {
        if (isOpenOptions) setIsOpenModelParamsBtns(false);
    }, [isOpenOptions]);

    return (
        <AnimatePresence>
            {isOpenOptions && (
                <motion.div
                    key="options-panel"
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'tween', duration: 0.3 }}
                    className={`${isMobile ? "w-full" : "w-1/4"} p-4 rounded-lg border-l space-y-6 overflow-auto absolute right-0 top-0 bottom-0 bg-white dark:bg-zinc-900 z-20 shadow-lg`}
                >
                    {/* Title */}
                    <div className="flex flex-row justify-between items-center gap-2">
                        <h3 className="flex text-lg font-semibold">API Options</h3>
                        <select
                            className="w-1/2 p-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                            value={currentApiType}
                            onChange={(e) => handleApiOptionsTabChange(e.target.value)}
                            disabled={isLoading || isReplying}
                        >
                            <option value="" disabled>Select api type</option>
                            {AI_PLAYGROUND_TAB_KEYS.map((_str: string, _idx) => (
                                <option
                                    key={_idx}
                                    value={_str}
                                    disabled={(_str === AI_PLAYGROUND_TAB_VALUE.AI)} // 暫不開放
                                >
                                    {(_str === AI_PLAYGROUND_TAB_VALUE.UNIEINFRA) ? "UnieInfra API" : (_str === AI_PLAYGROUND_TAB_VALUE.THIRD_PARTY) ? "Third Party" : (_str === AI_PLAYGROUND_TAB_VALUE.TEST_API) ? "Test API" : _str}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* LLM api settings */}
                    <div className="flex flex-col border p-4 rounded-lg gap-2 break-words whitespace-pre-wrap">
                        {(currentApiType === AI_PLAYGROUND_TAB_VALUE.AI) ? (
                            <>

                            </>
                        ) : (currentApiType === AI_PLAYGROUND_TAB_VALUE.UNIEINFRA) ? (
                            <>
                                <label className="text-sm">UnieInfra API Token</label>
                                <select
                                    className="w-full p-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                    value={apiToken}
                                    onChange={(e) => setApiToken(e.target.value)}
                                    disabled={isLoading || isReplying}
                                >
                                    <option value="" disabled>Select UnieInfra API Token</option>
                                    {tokens.map((token: any) => (
                                        <option
                                            key={token.id}
                                            value={`sk-${token.key}`}
                                        >
                                            {token.name}
                                        </option>
                                    ))}
                                </select>
                            </>
                        ) : (currentApiType === AI_PLAYGROUND_TAB_VALUE.THIRD_PARTY) ? (
                            <>
                                <label className="text-sm">Third-Party Token</label>
                                <select
                                    className="w-full p-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                    value={JSON.stringify({
                                        apiUrl: apiUrl,
                                        apiKey: apiToken,
                                    })}
                                    onChange={(e) => {
                                        const { apiUrl, apiKey } = JSON.parse(e.target.value);
                                        setApiUrl(apiUrl);
                                        setApiToken(apiKey)
                                        console.log(`apiUrl: ${apiUrl}\r\napiKey: ${apiKey}`);
                                    }}
                                    disabled={isLoading || isReplying}
                                >
                                    <option value="" disabled>Select Third-Party api token</option>
                                    {aiThirdPartyConfigs?.map((config) => (
                                        <option
                                            key={config.apiId}
                                            value={JSON.stringify({
                                                apiUrl: config.apiUrl,
                                                apiKey: config.apiKey,
                                            })}
                                        >
                                            {config.name}
                                        </option>
                                    ))}
                                </select>
                            </>
                        ) : (currentApiType === AI_PLAYGROUND_TAB_VALUE.TEST_API) && (
                            <>
                                <label className="text-sm flex flex-col">
                                    <span>API URL</span>
                                </label>

                                <input
                                    type="text"
                                    value={apiUrl}
                                    onChange={(e) => setApiUrl(e.target.value)}
                                    disabled={isLoading || isReplying}
                                    placeholder="https://your-api.com/v1"
                                    className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950"
                                />

                                <label className="text-sm">API Token</label>
                                <input
                                    type="password"
                                    value={apiToken}
                                    onChange={(e) => setApiToken(e.target.value)}
                                    disabled={isLoading || isReplying}
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
                            </>
                        )}
                    </div>

                    {(models.length > 0) ? (
                        <>
                            {/* chat room settings */}
                            <div className="flex flex-col border p-4 rounded-lg gap-2 break-words whitespace-pre-wrap">

                                <div className='flex flex-row justify-between'>
                                    <h3 className="text-lg font-semibold">Chat Room Settings</h3>

                                    {!isOpenChatRoomSettingsBtns ? (
                                        <Button
                                            onClick={() => setIsOpenChatRoomSettingsBtns(true)}
                                            className="px-2 py-1 text-sm bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white"
                                        >
                                            <ChevronDown className='w-3 h-3' />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setIsOpenChatRoomSettingsBtns(false)}
                                            className="px-2 py-1 text-sm bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white"
                                        >
                                            <ChevronUp className='w-3 h-3' />
                                        </Button>
                                    )}
                                </div>

                                {isOpenChatRoomSettingsBtns && (
                                    <>
                                        {/* Parallel instances */}
                                        <div className="space-y-2">
                                            <label className="text-sm">Parallel Instances</label>
                                            <div className="flex flex-row gap-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={maxCount}
                                                    value={tempParallelCount}
                                                    onChange={(e) => setTempParallelCount(Number(e.target.value))}
                                                    disabled={isLoading || isReplying}
                                                    className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950"
                                                />
                                                <Button
                                                    onClick={() => {
                                                        setParallelCount(tempParallelCount);
                                                        toast.success(`Parallel instances set to ${tempParallelCount}.`);
                                                    }}
                                                    className="w-full bg-blue-600 hover:bg-blue-800 text-white"
                                                    disabled={isLoading || isReplying || (parallelCount === tempParallelCount)}
                                                >
                                                    Set Parallel Instances
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Show thread btn */}
                                        <div className="space-y-2">
                                            <label className="text-sm">Show Threads</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {Array.from({ length: parallelCount }, (_, index) => (
                                                    <Button
                                                        key={index}
                                                        onClick={() => {
                                                            setSelectedIndexes(prev => {
                                                                if (prev.includes(index)) {
                                                                    return prev.filter(p => p !== index);
                                                                } else {
                                                                    if (prev.length >= maxSelectIndex) {
                                                                        return [...prev.slice(1), index]; // 移除最早的
                                                                    } else {
                                                                        return [...prev, index];
                                                                    }
                                                                }
                                                            });
                                                        }}
                                                        className={`px-2 py-1 text-sm
                                        bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white
                                        ${selectedIndexes.includes(index) ? "border-4 border-zinc-500" : "border-2"}
                                        `}
                                                    >
                                                        #{index + 1}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Summary for each thread */}
                                        {(parallelMessages.length > 0) && (
                                            <div className="space-y-2 w-full">
                                                <label className="text-sm">Threads Summary (Last Assistant Response)</label>
                                                <div className="space-y-2 w-full">
                                                    {parallelMessages.map((messages, index) => {
                                                        const last = [...messages].reverse().find(msg => msg.role === 'assistant');
                                                        return (
                                                            <Button
                                                                key={index}
                                                                className={`flex flex-row justify-between border rounded-md w-full overflow-hidden
                                                px-2 py-1 text-sm flex-1
                                                bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white
                                                ${selectedIndexes.includes(index) ? "border-4" : "border-2"}
                                                ${last?.state === "complete"
                                                                        ? "border-green-400 dark:border-green-600"
                                                                        : last?.state === "streaming"
                                                                            ? "border-yellow-400 dark:border-yellow-600"
                                                                            : last?.state === "error"
                                                                                ? "border-red-400 dark:border-red-600"
                                                                                : last?.state === "abort"
                                                                                    ? "border-orange-400 dark:border-orange-600"
                                                                                    : "border-zinc-400 dark:border-zinc-600"}`}
                                                                onClick={() => {
                                                                    setSelectedIndexes(prev => {
                                                                        if (prev.includes(index)) {
                                                                            return prev.filter(p => p !== index);
                                                                        } else {
                                                                            if (prev.length >= maxSelectIndex) {
                                                                                return [...prev.slice(1), index]; // 移除最早的
                                                                            } else {
                                                                                return [...prev, index];
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                            >
                                                                <div className="flex flex-row gap-2">
                                                                    <div className="text-sm">#{index + 1}</div>
                                                                    <div className="text-sm">{
                                                                        (() => {
                                                                            const modelName = threadModels[index] || defaultModel;
                                                                            return modelName.length > 10
                                                                                ? modelName.slice(0, 10) + "..."
                                                                                : modelName;
                                                                        })()
                                                                    }</div>

                                                                </div>
                                                                {last && (
                                                                    <>
                                                                        {last.durationMs != null && (
                                                                            <div>
                                                                                <span className="text-sm">{calculateCharsPerSecond(last.content, last.durationMs)}</span>
                                                                                <span className="text-xs ml-1">chars/sec</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Reset chat room btn */}
                                        <div className="space-y-2">
                                            <label className="text-sm">Reset Chat Room</label>
                                            <div className="flex flex-row gap-2">
                                                <Button
                                                    onClick={() => handleResetChatRoom(false)}
                                                    className="w-full bg-blue-600 hover:bg-blue-800 text-white"
                                                    disabled={isLoading || isReplying}
                                                >
                                                    Reset Msg
                                                </Button>
                                                <Button
                                                    onClick={() => handleResetChatRoom(true)}
                                                    className="w-full bg-blue-600 hover:bg-blue-800 text-white"
                                                    disabled={isLoading || isReplying}
                                                >
                                                    Reset Msg & Params
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* model params payload */}
                            <div className="flex flex-col border p-4 rounded-lg gap-2 break-words whitespace-pre-wrap">

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Model Params Payload</h3>

                                    {isDevelopment && (
                                        <>
                                            <div className="flex flex-row justify-between">

                                                <Button
                                                    key={0}
                                                    onClick={() => setEditParams(0)}
                                                    className={`px-2 py-1 text-xs
                                        bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white
                                        ${(editParams === 0) ? "border-4 border-zinc-500" : "border-2"}
                                        `}
                                                >
                                                    <div className='break-words whitespace-pre-wrap'>default</div>

                                                </Button>

                                                {!isOpenModelParamsBtns ? (
                                                    <Button
                                                        onClick={() => setIsOpenModelParamsBtns(true)}
                                                        className="px-2 py-1 text-sm bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white"
                                                    >
                                                        <ChevronDown className='w-3 h-3' />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => setIsOpenModelParamsBtns(false)}
                                                        className="px-2 py-1 text-sm bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white"
                                                    >
                                                        <ChevronUp className='w-3 h-3' />
                                                    </Button>
                                                )}

                                            </div>

                                            <div className="grid grid-cols-5 gap-2">
                                                {isOpenModelParamsBtns && (
                                                    <>
                                                        {Array.from({ length: parallelCount }, (_, index) => (
                                                            <Button
                                                                key={(index + 1)}
                                                                onClick={() => setEditParams(index + 1)}
                                                                className={`px-2 py-1 text-sm
                                                    bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white
                                                    ${(editParams === (index + 1)) ? "border-4 border-zinc-500" : "border-2"}
                                                    `}
                                                            >
                                                                #{index + 1}
                                                            </Button>
                                                        ))}
                                                    </>
                                                )}
                                            </div>

                                            <div className="h-px my-1 bg-zinc-200  dark:bg-zinc-800" />
                                        </>
                                    )}

                                    {/* model select */}
                                    {(editParams === 0) ? (
                                        <>
                                            {/* Select default model */}
                                            <div className="space-y-2">
                                                <label className="text-sm flex flex-col">
                                                    <span>Select Default Model</span>
                                                    {(threadModels.some(m => m === "") && defaultModel === "") && (
                                                        <span className="text-red-500">please set default model.</span>
                                                    )}
                                                </label>
                                                <select
                                                    className="w-full p-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                                    value={defaultModel}
                                                    onChange={(e) => setDefaultModel(e.target.value)}
                                                >
                                                    <option value="" disabled>Select a model</option>
                                                    {models.map((id: string) => (
                                                        <option key={id} value={id}>{id}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Select model */}
                                            <div className="space-y-2">
                                                <label className="text-sm">
                                                    <span>Select Chat Room {editParams} Model</span>
                                                </label>
                                                <select
                                                    className="w-full p-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                                    value={threadModels[editParams - 1]}
                                                    onChange={(e) => {
                                                        const newModels = [...threadModels];
                                                        newModels[editParams - 1] = e.target.value;
                                                        setThreadModels(newModels);
                                                    }}
                                                >
                                                    <option value="" disabled>Select a model</option>
                                                    {models.map((id: string) => (
                                                        <option key={id} value={id}>{id}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    <div className="h-px my-1 bg-zinc-200  dark:bg-zinc-800" />

                                    {/* Other Params */}
                                    <>
                                        <div className='flex flex-row justify-between'>
                                            <label className="text-sm">
                                                <span>Other Params</span>
                                            </label>

                                            {!isOpenLLMOtherParamsBtns ? (
                                                <Button
                                                    onClick={() => setIsOpenLLMOtherParamsBtns(true)}
                                                    className="px-2 py-1 text-sm bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white"
                                                >
                                                    <ChevronDown className='w-3 h-3' />
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => setIsOpenLLMOtherParamsBtns(false)}
                                                    className="px-2 py-1 text-sm bg-transparent hover:bg-zinc-200 hover:dark:bg-zinc-600 text-black dark:text-white"
                                                >
                                                    <ChevronUp className='w-3 h-3' />
                                                </Button>
                                            )}
                                        </div>

                                        {isOpenLLMOtherParamsBtns && (
                                            <>
                                                {/* Select default system prompt */}
                                                <div className="space-y-2">
                                                    <label className="text-sm">System Prompt</label>
                                                    <AutoResizeTextarea
                                                        value={defaultModelParams.system_prompt}
                                                        onChange={(e) => setDefaultModelParams(prev => ({ ...prev, system_prompt: e.target.value }))}
                                                        placeholder={"enter a system prompt..."}
                                                    />
                                                </div>

                                                {/* Select default temperature */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <label className="text-sm">Temperature</label>
                                                        <Badge variant="secondary">{defaultModelParams.temperature}</Badge>
                                                    </div>
                                                    <Slider
                                                        value={[defaultModelParams.temperature]}
                                                        onValueChange={([value]) => setDefaultModelParams(prev => ({ ...prev, temperature: value }))}
                                                        max={1}
                                                        step={0.1}
                                                    />
                                                </div>

                                                {/* Select default max tokens */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <label className="text-sm">Max Tokens</label>
                                                        <Badge variant="secondary">{defaultModelParams.max_tokens}</Badge>
                                                    </div>
                                                    <Slider
                                                        value={[defaultModelParams.max_tokens]}
                                                        onValueChange={([value]) => setDefaultModelParams(prev => ({ ...prev, max_tokens: value }))}
                                                        max={8000}
                                                        step={1}
                                                    />
                                                </div>

                                                {/* Select default Top P */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <label className="text-sm">Top P</label>
                                                        <Badge variant="secondary">{defaultModelParams.top_p}</Badge>
                                                    </div>
                                                    <Slider
                                                        value={[defaultModelParams.top_p]}
                                                        onValueChange={([value]) => setDefaultModelParams(prev => ({ ...prev, top_p: value }))}
                                                        max={1}
                                                        step={0.1}
                                                    />
                                                </div>

                                                {/* Select default Top K */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <label className="text-sm">Top K</label>
                                                        <Badge variant="secondary">{defaultModelParams.top_k}</Badge>
                                                    </div>
                                                    <Slider
                                                        value={[defaultModelParams.top_k]}
                                                        onValueChange={([value]) => setDefaultModelParams(prev => ({ ...prev, top_k: value }))}
                                                        max={100}
                                                        step={1}
                                                    />
                                                </div>

                                                {/* Select default presence penalty */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <label className="text-sm">Presence Penalty</label>
                                                        <Badge variant="secondary">{defaultModelParams.presence_penalty}</Badge>
                                                    </div>
                                                    <Slider
                                                        value={[defaultModelParams.presence_penalty]}
                                                        onValueChange={([value]) => setDefaultModelParams(prev => ({ ...prev, presence_penalty: value }))}
                                                        max={2}
                                                        step={0.1}
                                                    />
                                                </div>

                                                {/* Select default frequency penalty */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <label className="text-sm">Frequency Penalty</label>
                                                        <Badge variant="secondary">{defaultModelParams.frequency_penalty}</Badge>
                                                    </div>
                                                    <Slider
                                                        value={[defaultModelParams.frequency_penalty]}
                                                        onValueChange={([value]) => setDefaultModelParams(prev => ({ ...prev, frequency_penalty: value }))}
                                                        max={2}
                                                        step={0.1}
                                                    />
                                                </div>

                                                {/* Select default context length exceeded behavior */}
                                                <div className="space-y-2">
                                                    <label className="text-sm">Context Length Exceeded Behavior</label>
                                                    <select
                                                        className="w-full mt-1 p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                                                        value={defaultModelParams.context_length_exceeded_behavior}
                                                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                                                            setDefaultModelParams(prev => ({ ...prev, context_length_exceeded_behavior: event.target.value }))
                                                        }}
                                                    >
                                                        <option value="none">None</option>
                                                        <option value="truncate">Truncate</option>
                                                        <option value="error">Error</option>
                                                    </select>
                                                </div>

                                                {/* Select default echo */}
                                                <div className="flex flex-row items-center gap-2">
                                                    <>
                                                        <Checkbox
                                                            id="echo"
                                                            checked={defaultModelParams.echo}
                                                            onCheckedChange={(checked) => setDefaultModelParams(prev => ({ ...prev, echo: checked as boolean }))}
                                                        />
                                                        <label htmlFor="echo" className="text-sm">Echo</label>
                                                    </>
                                                </div>
                                            </>
                                        )}
                                    </>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {(apiUrl !== "" && apiToken !== "") ? (
                                <label className="text-sm text-red-500">This API doesn't have any models.</label>
                            ) : (
                                <>

                                </>
                            )}
                        </>
                    )}
                </motion.div >
            )}
        </AnimatePresence >
    )
};
