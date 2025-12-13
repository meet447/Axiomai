"use client";

import { CloudIcon, CloudOffIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useConfigStore } from "@/stores";
import { Switch } from "./ui/switch";
import { useSession } from "next-auth/react";
import { useState } from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "./ui/separator";
import { env } from "@/env.mjs";
import { memo } from "react";
import { SignUpModal } from "./sign-up-modal";

const ProToggle = () => {
  const { proMode, toggleProMode } = useConfigStore();
  const { status } = useSession();
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const isGuest = status !== "authenticated";

  const handleToggle = () => {
    if (isGuest) {
      setShowSignUpModal(true);
      return;
    }
    toggleProMode();
  };

  return (
    <>
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
        reason="expert"
      />
      <HoverCard>
        <HoverCardTrigger
          asChild
          className={cn(
            "hover:cursor-pointer",
            !env.NEXT_PUBLIC_LOCAL_MODE_ENABLED && "hover:cursor-not-allowed",
          )}
        >
          <div className="group flex space-x-2 items-center justify-end pr-3 hover:text-primary">
            <Switch
              disabled={!env.NEXT_PUBLIC_PRO_MODE_ENABLED}
              checked={proMode}
              onCheckedChange={handleToggle}
            />
            <span
              className={cn(
                "font-medium text-sm transition-all hidden sm:inline",
                proMode ? "text-tint " : "text-gray-500 group-hover:text-primary",
              )}
            >
              Expert
            </span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-3">
          <div className="flex flex-col items-start rounded-md ">
            <div className="text-lg font-medium ">
              <span className="text-tint">Expert </span>
              <span>Mode</span>
            </div>
            <div className="text-sm gap-y-1 flex flex-col ">
              <div>
                Expert mode will create a plan to answer your question to make the
                answer more accurate.
              </div>
            </div>
            <Separator className="mt-1" />
            <div className="text-xs text-muted-foreground mt-2">
              {isGuest ? (
                <span>Sign up to unlock Expert mode.</span>
              ) : (
                <span>Available in your account.</span>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </>
  );
};

export default ProToggle;
