"use client";

import { useChatHistory } from "@/hooks/history";
import { MessageSquare, Plus, Library, Newspaper, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const { data: history } = useChatHistory();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const Content = () => (
        <div className="flex flex-col h-full bg-background border-r w-64 p-4 space-y-4">

            {/* Title Header */}
            <div className="flex items-center space-x-2 px-2 mb-2">
                <div className="h-6 w-6 bg-primary rounded-full" />
                <span className="font-bold text-xl tracking-tight">Axiom</span>
            </div>

            <Button asChild className="w-full justify-start space-x-2 shadow-sm font-semibold">
                <Link href="/" onClick={() => setOpen(false)}>
                    <Plus className="w-4 h-4" />
                    <span>New Chat</span>
                </Link>
            </Button>

            <div className="space-y-1">
                <Link href="/discover" onClick={() => setOpen(false)}>
                    <Button variant={pathname === '/discover' ? 'secondary' : 'ghost'} className="w-full justify-start space-x-2">
                        <Newspaper className="w-4 h-4" />
                        <span>Discover</span>
                    </Button>
                </Link>
                <Link href="/library" onClick={() => setOpen(false)}>
                    <Button variant={pathname === '/library' ? 'secondary' : 'ghost'} className="w-full justify-start space-x-2">
                        <Library className="w-4 h-4" />
                        <span>Library</span>
                    </Button>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground px-2">History</h3>
                {history?.map((chat) => (
                    <Link key={chat.id} href={`/search/${chat.id}`} onClick={() => setOpen(false)}>
                        <Button variant="ghost" className={cn("w-full justify-start text-xs h-auto py-2 whitespace-normal text-left", pathname === `/search/${chat.id}` && "bg-muted")}>
                            <span className="line-clamp-2">{chat.title}</span>
                        </Button>
                    </Link>
                ))}
            </div>
        </div>
    );

    // Mobile
    return (
        <>
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <Content />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden md:flex h-screen sticky top-0">
                <Content />
            </div>
        </>
    );
}
