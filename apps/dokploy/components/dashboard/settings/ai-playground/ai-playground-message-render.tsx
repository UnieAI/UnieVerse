"use client";

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useIsMobile } from "@/hooks/use-mobile";

import { UnieAISVG } from "@/utils/unieai/unieai-svg";
import { AiPlaygroundWaveLoading } from "./ai-playground-wave-loading";
import { AiPlaygroundMessageTimingDetail } from "./ai-playground-message-timing-detail";

import { copyImageLink, normalizeUrl } from "./functions";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AiPlaygroundMessageRenderProps {
    thread: number;
    messages: any;
    threadModels: any;
    setThreadModels: any;
    model: any;
    models: any;
}

export const AiPlaygroundMessageRender = ({ thread, messages, threadModels, setThreadModels, model, models }: AiPlaygroundMessageRenderProps) => {
    const isMobile = useIsMobile();
    return (
        <>
            <div className="flex  flex-row items-start justify-between gap-6 px-4 text-sm text-zinc-500 font-semibold mb-1">
                <div>#{thread}</div>
                <select
                    value={threadModels[thread - 1] || ""}
                    onChange={(e) => {
                        const newModels = [...threadModels];
                        newModels[thread - 1] = e.target.value;
                        setThreadModels(newModels);
                    }}
                    className={`${isMobile ? "w-24" : "w-36"} p-0.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950`}
                >
                    <option value="">(Default: {model || "none"})</option>
                    {models.map((id: string) => (
                        <option key={id} value={id}>{id}</option>
                    ))}
                </select>
            </div>
            <div className='w-full flex flex-col gap-5 mt-5'>
            {
                messages.map((message: any, index: any) => (
                    <motion.div
                        key={index}
                        className={`mt-5 w-full flex mr-10 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {/* {message.role === 'assistant' && (
                            <div className="border rounded-full h-8 w-8 flex items-center justify-center">
                                <UnieAISVG className='text-blue-500 h-6 w-6' />
                            </div>
                        )} */}

                        <div
                            className={`px-4  py-2 max-w-[90%] ${(message.role === 'user') && "bg-zinc-200 mr-4 justify-end w-fit dark:bg-zinc-600"}`}
                            style={{
                                borderRadius: '0.9rem',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {(message.content === "loading" && message.loading) ? (
                                <div className='flex flex-row'>
                                    <AiPlaygroundWaveLoading />
                                </div>
                            ) : (
                                <>
                                    {/* 渲染訊息 */}
                                    <RenderedResult content={message.content} />

                                    {/* 顯示回應時間與耗時 */}
                                    {(message.role === "assistant") && (
                                        <AiPlaygroundMessageTimingDetail message={message} />
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                ))
            }
            </div>
        </>
    )
};

// ---  Other msg render Components --- //

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
                    <ImageComponent key={imgUrl} url={normalizeUrl(imgUrl!)} />
                );
            }
        }
        // 處理影片
        else if (/\[video\]/i.test(match[0])) {
            const videoMatch = match[0].match(/\((https?:\/\/[^\s\)]+)\)/);
            if (videoMatch) {
                const videoUrl = videoMatch[1];
                resultElements.push(
                    <VideoComponent key={videoUrl} url={normalizeUrl(videoUrl!)} />
                );
            }
        }
        // 處理超連結
        else if (/\[link\]/i.test(match[0])) {
            const linkMatch = match[0].match(/\((https?:\/\/[^\s\)]+)\)/);
            if (linkMatch) {
                const linkUrl = linkMatch[1];
                resultElements.push(
                    <LinkComponent key={linkUrl} url={normalizeUrl(linkUrl!)} />
                );
            }
        }
        // 處理其他連結
        else {
            const otherMatch = match[0].match(/\((https?:\/\/[^\s\)]+)\)/);
            if (otherMatch) {
                const otherUrl = otherMatch[1];
                resultElements.push(
                    <LinkComponent key={otherUrl} url={normalizeUrl(otherUrl!)} />
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
            //.filter(line => line.trim() !== '') // 過濾空行
            .join('\n')
    );
    // const parsedText = parseMarkdown(
    //     text.replace(/^\s*\n/, '') // 只移除開頭第一個空行（或多個連續空行）
    // );


    // 用正則拆分出 think 區塊與普通文字
    const parts = parsedText.split(/(\[\[THINK_START\]\][\s\S]*?\[\[THINK_END\]\])/g);

    return (
        <div className='flex flex-col items-start'>
            {parts.map((part, index) => {
                if (part.startsWith('[[THINK_START]]')) {
                    const content = part.replace('[[THINK_START]]', '').replace('[[THINK_END]]', '').replace(/^\s*\n/, '');
                    return <ThinkBlock key={index} content={content} />;
                } else {
                    return (
                        <div
                            className=''
                            key={index}
                            dangerouslySetInnerHTML={{ __html: part.replace(/^\s*\n/, '').replace('\n\n/g','\n') }}
                        />
                    );
                }
            })}
        </div>
    );
};

// 思考區塊元件
const ThinkBlock = ({ content }: { content: string }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div>
            {/* <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm opacity-40 hover:opacity-60"
            >
                {isOpen ? 'Close Think ▲' : 'Think ▼'}
            </button>
            {isOpen && (
                <div
                    className='text-sm ml-1 pl-5 opacity-50 border-l-2'
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )} */}
            <Accordion type="single" collapsible >
                <AccordionItem value="think" className='border-b-0'>
                    <AccordionTrigger className='justify-start text-sm opacity-40 hover:opacity-60'>Thinking</AccordionTrigger>
                    <AccordionContent>
                        <div
                            className='text-sm ml-1 pl-5 opacity-50 border-l-2'
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </AccordionContent>
                </AccordionItem>
                </Accordion>
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
