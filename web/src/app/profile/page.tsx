"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TOPICS = [
    { id: "tech", label: "Tech & Science", emoji: "💻" },
    { id: "finance", label: "Finance", emoji: "💰" },
    { id: "arts", label: "Arts & Culture", emoji: "🎨" },
    { id: "sports", label: "Sports", emoji: "⚽" },
    { id: "politics", label: "Politics", emoji: "🏛️" },
    { id: "health", label: "Health", emoji: "🏥" },
    { id: "entertainment", label: "Entertainment", emoji: "🎬" },
    { id: "travel", label: "Travel", emoji: "✈️" },
    { id: "food", label: "Food", emoji: "🍕" },
    { id: "gaming", label: "Gaming", emoji: "🎮" },
];

const PROFESSIONS = [
    "Software Developer",
    "Designer",
    "Product Manager",
    "Data Scientist",
    "Student",
    "Researcher",
    "Entrepreneur",
    "Marketing",
    "Finance",
    "Other",
];

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [name, setName] = useState("");
    const [profession, setProfession] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            fetch("/api/user/profile")
                .then((res) => res.json())
                .then((data) => {
                    setName(data.name || session?.user?.name || "");
                    setProfession(data.profession || "");
                    setInterests(data.interests || []);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [status, session, router]);

    const handleTopicToggle = (topicId: string) => {
        setInterests((prev) =>
            prev.includes(topicId)
                ? prev.filter((t) => t !== topicId)
                : [...prev, topicId]
        );
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, profession, interests }),
            });

            if (res.ok) {
                await update({ name });
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error("Failed to save profile", err);
        }
        setSaving(false);
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-2xl">
            <div className="mb-6">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back to chat
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Email (read-only) */}
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={session?.user?.email || ""} disabled className="bg-muted" />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setSaved(false); }}
                            placeholder="Your name"
                        />
                    </div>

                    {/* Profession */}
                    <div className="space-y-2">
                        <Label>Profession</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {PROFESSIONS.map((prof) => (
                                <button
                                    key={prof}
                                    onClick={() => { setProfession(prof); setSaved(false); }}
                                    className={cn(
                                        "px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                                        profession === prof
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    {prof}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interests */}
                    <div className="space-y-2">
                        <Label>Topics of Interest</Label>
                        <p className="text-sm text-muted-foreground">Select topics to personalize your Discover feed</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {TOPICS.map((topic) => (
                                <button
                                    key={topic.id}
                                    onClick={() => handleTopicToggle(topic.id)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                                        interests.includes(topic.id)
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <span>{topic.emoji}</span>
                                    <span className="flex-1 text-left">{topic.label}</span>
                                    {interests.includes(topic.id) && <Check className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {saved ? "Saved!" : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
