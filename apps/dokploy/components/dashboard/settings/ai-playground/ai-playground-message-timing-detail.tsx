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
                className="hover:underline"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? "hide detail ▲" : "detail ▼"}
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
                            <span>TTFT: </span>
                            <span className="text-sm">{calculateWaitTime(message.requestTime, message.responseStartTime)}</span>
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
                            <span>Total time: </span>
                            <span className="text-sm">{(message.durationMs / 1000).toFixed(2)}</span>
                            <span className="ml-1">sec</span>
                        </div>
                    )}
                    {message.durationMs != null && (
                        <div>
                            <span>TPS: </span>
                            <span className="text-sm">
                                {calculateCharsPerSecond(message.content, message.durationMs)}
                            </span>
                            <span className="ml-1">chars/sec</span>
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
