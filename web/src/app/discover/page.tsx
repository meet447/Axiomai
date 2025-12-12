"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";

interface Trend {
    id: number;
    title: string;
    summary: string;
    url: string;
    image: string;
}

export default function DiscoverPage() {
    const [trends, setTrends] = useState<Trend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/discover")
            .then((res) => res.json())
            .then((data) => {
                if (data.trends) setTrends(data.trends);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="container mx-auto py-10 px-4">Loading trending news...</div>;
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex items-center gap-2 mb-8">
                <Newspaper className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Discover
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trends.map((trend) => (
                    <Card
                        key={trend.id}
                        className="group overflow-hidden bg-muted/40 border-0 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="h-48 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={trend.image}
                                alt={trend.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute bottom-3 left-3 right-3 z-20">
                                <h3 className="text-white font-bold leading-tight line-clamp-2 drop-shadow-md">
                                    {trend.title}
                                </h3>
                            </div>
                        </div>
                        <CardContent className="p-4 pt-4 flex flex-col justify-between h-[150px]">
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                {trend.summary}
                            </p>
                            <Button
                                asChild
                                variant="secondary"
                                className="w-full mt-auto bg-muted hover:bg-primary hover:text-primary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                            >
                                <Link href={`/?q=${encodeURIComponent(trend.title)}`}>
                                    Ask Axiom{" "}
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
