// UnieInfraConnectionHintPoint.tsx

"use client";

import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

interface UnieInfraConnectionHintPointProps {
  showState?: boolean;
}

export const UnieInfraConnectionHintPoint = ({ showState }: UnieInfraConnectionHintPointProps) => {
  const { accessToken, isConnecting } = useUnieInfra();

  useEffect(() => {

  }, [accessToken, isConnecting]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-row items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnecting ? "bg-orange-500" : (accessToken !== null) ? "bg-green-500" : "bg-red-500"
              )}
            />
            {showState && (
              <span
                className={cn(
                  "",
                  isConnecting ? "bg-orange-500" : (accessToken !== null) ? "text-green-500" : "text-red-500"
                )}
              >
                {isConnecting ? "Connecting" : (accessToken !== null) ? "Connected" : "Unconnected"}
              </span>
            )}
          </div>
        </TooltipTrigger>
        {!showState && (
          <TooltipContent>
            <p>{isConnecting ? "Connecting with UnieInfra" : (accessToken !== null) ? "UnieInfra connected" : "UnieInfra unconnected"}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
