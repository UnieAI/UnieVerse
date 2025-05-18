import React, { useState } from 'react'

import { Message } from ".";
import { calculateCharsPerSecond, calculateWaitTime } from './functions';

interface AiPlaygroundMessageTimingDetailProps {
    message: Message;
}

export const AiPlaygroundMessageTimingDetail = ({ message }: AiPlaygroundMessageTimingDetailProps) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mt-1 text-xs opacity-60 text-left">
            <button
                className="hover:underline text-xs text-neutral-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? "Hide detail ▲" : "Detail ▼"}
            </button>

            {isOpen && (
                <div className="mt-1 space-y-0.5">
                    {/* {message.requestTime && (
                        <div>
                            <span>Send request: </span>
                            <span className="text-sm">{new Date(message.requestTime).toLocaleTimeString()}</span>
                        </div>
                    )} */}
                    {message.requestTime && message.responseStartTime && (
                        <div>
                            <span className="text-xs text-neutral-500">TTFT: </span>
                            <span className="text-xs text-neutral-500">{calculateWaitTime(message.requestTime, message.responseStartTime)}</span>
                        </div>
                    )}
                    {/* {message.responseStartTime && (
                        <div>
                            <span>Get first response: </span>
                            <span className="text-sm">{new Date(message.responseStartTime).toLocaleTimeString()}</span>
                        </div>
                    )}
                    {message.responseEndTime && (
                        <div>
                            <span>Get last response: </span>
                            <span className="text-sm">{new Date(message.responseEndTime).toLocaleTimeString()}</span>
                        </div>
                    )} */}
                    {message.durationMs != null && (
                        <div>
                            <span className="text-xs text-neutral-500">Total time: </span>
                            <span className="text-xs text-neutral-500">{(message.durationMs / 1000).toFixed(2)}</span>
                            <span className="text-xs ml-1 text-neutral-500">sec</span>
                        </div>
                    )}
                    {message.durationMs != null && (
                        <div>
                            <span className="text-xs text-neutral-500">TPS: </span>
                            <span className="text-xs text-neutral-500">
                                {calculateCharsPerSecond(message.content, message.durationMs)}
                            </span>
                            <span className="ml-1 text-xs text-neutral-500">chars/sec</span>
                        </div>
                    )}
                    {message.state != null && (
                        <span
                            className={`opacity-50 
                            ${message.state === "complete"
                                    ? "text-green-500"
                                    : message.state === "streaming"
                                        ? "text-yellow-500"
                                        : message.state === "error"
                                            ? "text-red-500"
                                            : message.state === "abort"
                                                ? "text-orange-500"
                                                : ""}
                            `}
                        >
                            {message.state}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
