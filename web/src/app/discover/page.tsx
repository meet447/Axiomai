"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Newspaper, TrendingUp, CloudSun, DollarSign, Monitor, Palette, Trophy, Film, X, Plus } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Trend {
    id: string;
    title: string;
    summary: string;
    url: string;
    image: string | null;
}

interface Category {
    category: string;
    items: Trend[];
}

const CATEGORIES = [
    { id: 'all', label: 'For You', icon: null },
    { id: 'top', label: 'Top', icon: TrendingUp },
    { id: 'tech', label: 'Tech & Science', icon: Monitor },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'arts', label: 'Arts & Culture', icon: Palette },
    { id: 'sports', label: 'Sports', icon: Trophy },
];

export default function DiscoverPage() {
    const [data, setData] = useState<{ trends: Trend[], categories: Category[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        fetch("/api/discover")
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const getDisplayItems = () => {
        if (!data) return [];
        if (activeTab === 'all') return data.trends;
        return data.categories.find(c => c.category === activeTab)?.items || [];
    };

    const items = getDisplayItems();
    const featured = items[0];
    const rest = items.slice(1);

    if (loading) {
        return (
            <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl">
                <div className="flex gap-8">
                    <div className="flex-1 space-y-6">
                        <Skeleton className="h-10 w-48 mb-8" />
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
                        </div>
                    </div>
                    <div className="hidden lg:block w-80 space-y-6">
                        <Skeleton className="h-64 rounded-xl" />
                        <Skeleton className="h-40 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-8 max-w-7xl min-h-screen">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-serif font-medium tracking-tight text-foreground">Discover</h1>
                    <div className="hidden md:flex ml-4">
                        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="h-9">
                            <TabsList className="bg-transparent p-0 gap-2 h-9">
                                {CATEGORIES.slice(0, 4).map(cat => (
                                    <TabsTrigger
                                        key={cat.id}
                                        value={cat.id}
                                        className="rounded-full px-4 py-2 text-sm border bg-background data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all"
                                    >
                                        {cat.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Main Content */}
                <div className="flex-1">

                    {/* Featured Article */}
                    {featured && (
                        <Link href={`/news/${encodeURIComponent(featured.title)}`} className="group block mb-10">
                            <div className="relative rounded-2xl overflow-hidden aspect-[2/1] bg-muted">
                                {featured.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={featured.image}
                                        alt={featured.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
                                        <Newspaper className="w-16 h-16 text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />

                                <div className="absolute bottom-0 left-0 p-8 w-full md:w-3/4">
                                    <div className="flex items-center gap-2 mb-3 text-xs font-medium text-white/80 uppercase tracking-wider">
                                        <TrendingUp className="w-3 h-3" /> Trending
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-2 leading-tight group-hover:underline decoration-2 underline-offset-4">
                                        {featured.title}
                                    </h2>
                                    <p className="text-white/80 text-sm md:text-base line-clamp-2 md:line-clamp-3 max-w-2xl">
                                        {featured.summary}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* Grid of Articles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rest.map((item) => (
                            <Link key={item.id} href={`/news/${encodeURIComponent(item.title)}`} className="group block h-full">
                                <Card className="h-full border-0 bg-transparent shadow-none hover:bg-muted/30 transition-colors rounded-xl overflow-hidden">
                                    <div className="aspect-video relative rounded-xl overflow-hidden bg-muted mb-3">
                                        {item.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Newspaper className="w-8 h-8 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-0">
                                        <h3 className="font-serif text-lg font-medium leading-tight mb-2 group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {item.summary}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                            {/* We can calculate time or mock it for now since scraper doesn't give date reliably */}
                                            <span>2 hours ago</span>
                                            <span>•</span>
                                            <span>5 mins read</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Sidebar (Right) */}
                <div className="hidden lg:block w-80 space-y-8">

                    {/* Make it yours Widget */}
                    <Card className="bg-secondary/20 border-0 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-2 right-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-2">Make it yours</h3>
                            <p className="text-sm text-muted-foreground mb-4">Select topics and interests to customize your Discover experience</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {['Tech & Science', 'Finance', 'Arts & Culture', 'Sports'].map(tag => (
                                    <span key={tag} className="text-xs bg-background/50 border px-2 py-1 rounded-md text-muted-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0">
                                Save Interests
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Weather Widget (Mock) */}
                    <Card className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white border-0 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <CloudSun className="h-5 w-5 text-yellow-300" />
                                        <span className="text-sm font-medium">Weather</span>
                                    </div>
                                    <div className="text-3xl font-bold">72°F</div>
                                    <div className="text-sm text-white/60">New York, NY</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-white/60">H: 78° L: 64°</div>
                                    <div className="text-xs text-white/60">Sunny</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-xs text-white/50">
                                {['Mon', 'Tue', 'Wed', 'Thu'].map(d => (
                                    <div key={d} className="flex flex-col gap-1">
                                        <CloudSun className="h-3 w-3 mx-auto" />
                                        <span>{d}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Market Widget (Mock) */}
                    <Card className="bg-background border rounded-2xl">
                        <CardContent className="p-5">
                            <h3 className="font-semibold text-sm mb-4">Market Outlook</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">S&P 500</span>
                                        <span className="text-[10px] text-muted-foreground">INDEXSP</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-red-500">-0.14%</div>
                                        <div className="text-[10px] text-muted-foreground">4,280.50</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">NASDAQ</span>
                                        <span className="text-[10px] text-muted-foreground">IXIC</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-green-500">+0.47%</div>
                                        <div className="text-[10px] text-muted-foreground">13,592.25</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">BTC/USD</span>
                                        <span className="text-[10px] text-muted-foreground">Bitcoin</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-green-500">+1.2%</div>
                                        <div className="text-[10px] text-muted-foreground">98,000.00</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
