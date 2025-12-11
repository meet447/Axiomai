"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FOCUS_MODES, FocusMode } from "@/lib/types/focus";
import { useConfigStore } from "@/stores";
import { ChevronDown } from "lucide-react";

export const FocusSelector = () => {
    const { focusMode, setFocusMode } = useConfigStore();

    const currentMode = FOCUS_MODES.find((m) => m.id === focusMode) || FOCUS_MODES[0];
    const Icon = currentMode.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all"
                >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{currentMode.name}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
                {FOCUS_MODES.map((mode) => {
                    const ModeIcon = mode.icon;
                    const isActive = focusMode === mode.id;

                    return (
                        <DropdownMenuItem
                            key={mode.id}
                            onClick={() => setFocusMode(mode.id)}
                            className="gap-3 py-2 cursor-pointer"
                        >
                            <ModeIcon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                            <div className="flex flex-col gap-0.5">
                                <span className={cn("text-sm font-medium", isActive && "text-primary")}>
                                    {mode.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {mode.description}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
