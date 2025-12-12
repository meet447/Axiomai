"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, LogIn } from "lucide-react";

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        );
    }

    if (!session) {
        if (collapsed) {
            return (
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                    <Link href="/login">
                        <LogIn className="h-4 w-4" />
                    </Link>
                </Button>
            );
        }
        return (
            <Button asChild variant="default" className="w-full">
                <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                </Link>
            </Button>
        );
    }

    const initials = session.user?.name
        ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
        : session.user?.email?.charAt(0).toUpperCase() || "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={collapsed ? "h-9 w-9 p-0" : "w-full justify-start gap-2"}
                >
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                        {initials}
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col items-start text-left flex-1 truncate">
                            <span className="text-sm font-medium truncate">
                                {session.user?.name || "User"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                {session.user?.email}
                            </span>
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => signOut({ callbackUrl: "/" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
