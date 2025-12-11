"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { SiX, SiGithub, SiDiscord } from "react-icons/si";

export function Footer() {
  const [status, setStatus] = useState<string>("Checking...");

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/health", { method: "GET" });
        if (res.status === 200) {
          setStatus("✅ All systems are operational");
        } else {
          setStatus("⚠️ Some systems may be down");
        }
      } catch (err) {
        setStatus("❌ Unable to reach server");
      }
    }

    checkStatus();
  }, []);

  return (
    <footer className="w-full flex fixed bottom-0 right-0 p-1 z-50 bg-background/95">
      <div className="px-1 w-full flex flex-row justify-between items-center">
        <span className="text-xs text-muted-foreground">{status}</span>
        <div className="flex flex-row justify-end space-x-1">
          <Button variant="ghost" size="icon" className="hover:bg-transparent">
            <Link href="" target="_blank">
              <SiDiscord size={16} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-transparent">
            <Link href="https://github.com/meet447" target="_blank">
              <SiGithub size={16} />
            </Link>
          </Button>
          <Link href="" target="_blank">
            <Button variant="ghost" size="icon" className="hover:bg-transparent">
              <SiX size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </footer>
  );
}