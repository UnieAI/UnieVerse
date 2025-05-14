// UnieInfraConnectionHintPoint.tsx

"use client";

import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUnieInfraAccessToken } from "@/utils/unieai/unieinfra/user/use-unieInfraAccessToken";

export const UnieInfraConnectionHintPoint = () => {
  const { accessToken } = useUnieInfraAccessToken();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(accessToken !== null);
  }, [accessToken]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "bg-green-500" : "bg-red-500"
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{connected ? "UnieInfra connected" : "UnieInfra unconnected"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
