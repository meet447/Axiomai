"use client";

import { useChatHistory, useDeleteChat } from "@/hooks/history";
import { Plus, Library, Newspaper, Menu, ChevronLeft, ChevronRight, MessageSquare, History, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { useChatStore } from "@/stores";
import { UserMenu } from "./user-menu";

export function Sidebar() {
    const { data: history } = useChatHistory();
    const { mutate: deleteChat } = useDeleteChat();
    const { setMessages, setThreadId } = useChatStore();
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle mobile detection for responsiveness
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleNewChat = () => {
        setThreadId(null);
        setMessages([]);
        setOpen(false);
        router.push('/');
    };

    const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) => {
        if (isCollapsed) {
            return (
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant={active ? "secondary" : "ghost"} size="icon" className="h-9 w-9">
                                <Link href={href} className="flex items-center justify-center">
                                    <Icon className="h-4 w-4" />
                                    <span className="sr-only">{label}</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-4">
                            {label}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return (
            <Button asChild variant={active ? "secondary" : "ghost"} className="w-full justify-start space-x-2 px-2">
                <Link href={href}>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                </Link>
            </Button>
        );
    };

    const SidebarContent = () => (
        <div className={cn("flex flex-col h-full bg-background border-r transition-all duration-300", isCollapsed ? "w-16 items-center py-4" : "w-64 p-4")}>

            {/* Header & Toggle */}
            <div className={cn("flex items-center mb-4", isCollapsed ? "justify-center" : "justify-between px-2")}>
                {!isCollapsed && (
                    <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 bg-primary rounded-full" />
                        <span className="font-bold text-xl tracking-tight">Axiom</span>
                    </div>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={toggleCollapse}>
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* New Chat */}
            <div className={cn("mb-4", isCollapsed ? "px-0" : "px-0")}>
                {isCollapsed ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" className="h-9 w-9 bg-tint hover:bg-tint/80 text-white" onClick={handleNewChat}>
                                    <Plus className="w-4 h-4" />
                                    <span className="sr-only">New Chat</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">New Chat</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Button className="w-full justify-start space-x-2 shadow-sm font-semibold h-10 px-2 bg-tint hover:bg-tint/80 text-white" onClick={handleNewChat}>
                        <Plus className="w-4 h-4" />
                        <span>New Chat</span>
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <div className="space-y-2 w-full flex flex-col items-center">
                <NavItem href="/discover" icon={Newspaper} label="Discover" active={pathname === '/discover'} />
                <NavItem href="/library" icon={Library} label="Library" active={pathname === '/library'} />
            </div>

            {/* History */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto space-y-2 pt-6 w-full">
                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2 flex items-center gap-2">
                        <History className="w-3 h-3" /> Recent
                    </h3>
                    {history?.slice(0, 5).map((chat) => (
                        <div key={chat.id} className="group flex items-center pr-2 relative">
                            <Link href={`/search/${chat.id}`} onClick={() => setOpen(false)} className="flex-1 min-w-0">
                                <Button variant="ghost" className={cn("w-full justify-start text-xs h-auto py-2 whitespace-normal text-left px-2", pathname === `/search/${chat.id}` && "bg-muted")}>
                                    <span className="line-clamp-1">{chat.title}</span>
                                </Button>
                            </Link>
                            <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (confirm("Delete this chat?")) {
                                            deleteChat(chat.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* User Menu at Bottom */}
            <div className={cn("mt-auto pt-4 border-t", isCollapsed ? "w-full flex justify-center" : "")}>
                <UserMenu collapsed={isCollapsed} />
            </div>

        </div>
    );

    if (isMobile) {
        return (
            <div className="md:hidden fixed top-4 left-4 z-[60]">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <div className="flex flex-col h-full bg-background p-4 space-y-4">
                            {/* Mobile Content (Always Expanded) */}
                            <div className="flex items-center space-x-2 px-2 mb-4">
                                <span className="font-bold text-xl">Axiom</span>
                            </div>
                            <Button asChild className="w-full justify-start space-x-2">
                                <Link href="/" onClick={handleNewChat}>
                                    <Plus className="w-4 h-4" />
                                    <span>New Chat</span>
                                </Link>
                            </Button>
                            <div className="space-y-1">
                                <Button asChild variant={pathname === '/discover' ? 'secondary' : 'ghost'} className="w-full justify-start space-x-2">
                                    <Link href="/discover" onClick={() => setOpen(false)}><Newspaper className="w-4 h-4" /><span>Discover</span></Link>
                                </Button>
                                <Button asChild variant={pathname === '/library' ? 'secondary' : 'ghost'} className="w-full justify-start space-x-2">
                                    <Link href="/library" onClick={() => setOpen(false)}><Library className="w-4 h-4" /><span>Library</span></Link>
                                </Button>
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
                    </SheetContent>
                </Sheet>
            </div>
        )
    }

    return (
        <div className="hidden md:flex h-screen sticky top-0">
            <SidebarContent />
        </div>
    );
}
