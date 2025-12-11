
"use client";

import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";
import { useConfigStore } from "@/stores";
import { Switch } from "./ui/switch";

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "./ui/separator";
import { memo } from "react";

const AgenticToggle = () => {
    const { agenticMode, toggleAgenticMode } = useConfigStore();

    return (
        <HoverCard>
            <HoverCardTrigger asChild className="hover:cursor-pointer">
                <div className="group flex space-x-2 items-center justify-end pr-3 hover:text-primary">
                    <Switch
                        checked={agenticMode}
                        onCheckedChange={toggleAgenticMode}
                        className="data-[state=checked]:bg-indigo-500"
                    />
                    <span
                        className={cn(
                            "font-medium text-sm transition-all",
                            agenticMode ? "text-indigo-500" : "text-gray-500 group-hover:text-primary",
                        )}
                    >
                        Agent
                    </span>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-3">
                <div className="flex flex-col items-start rounded-md ">
                    <div className="text-lg font-medium ">
                        <span className="text-indigo-500">Agentic </span>
                        <span>Mode</span>
                    </div>
                    <div className="text-sm gap-y-1 flex flex-col ">
                        <div>
                            Autonomous agent that researches on your behalf.
                            It performs multiple steps of searching and browsing to build a comprehensive answer.
                        </div>
                    </div>
                    <Separator className="mt-1" />
                    <div className="text-xs text-muted-foreground mt-2">
                        <span>Powered by ReAct </span>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

export default AgenticToggle;
