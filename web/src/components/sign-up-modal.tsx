"use client";

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, MessageSquare, History } from "lucide-react";
import Link from "next/link";

interface SignUpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reason?: "limit" | "expert" | "history";
}

export function SignUpModal({ open, onOpenChange, reason = "limit" }: SignUpModalProps) {
    const messages = {
        limit: {
            title: "You've reached the free limit",
            description: "Sign up to continue chatting with unlimited messages and follow-ups.",
        },
        expert: {
            title: "Expert Mode requires an account",
            description: "Sign up to unlock Expert Mode with advanced research capabilities.",
        },
        history: {
            title: "Save your chat history",
            description: "Sign up to save your conversations and access them anytime.",
        },
    };

    const { title, description } = messages[reason];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {reason === "expert" ? (
                            <Sparkles className="h-5 w-5 text-primary" />
                        ) : reason === "history" ? (
                            <History className="h-5 w-5 text-primary" />
                        ) : (
                            <MessageSquare className="h-5 w-5 text-primary" />
                        )}
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <span>Unlimited conversations</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <span>Expert Mode with deep research</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <History className="h-4 w-4 text-primary" />
                        </div>
                        <span>Saved chat history</span>
                    </div>
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                    <Button asChild className="w-full">
                        <Link href="/register">Create Free Account</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                        <Link href="/login">Already have an account? Sign in</Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
