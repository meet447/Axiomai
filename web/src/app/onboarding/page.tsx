"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

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

export default function OnboardingPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [name, setName] = useState(session?.user?.name || "");
    const [profession, setProfession] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTopicToggle = (topicId: string) => {
        setInterests((prev) =>
            prev.includes(topicId)
                ? prev.filter((t) => t !== topicId)
                : [...prev, topicId]
        );
    };

    const handleSubmit = async () => {
        if (interests.length < 3) {
            setError("Please select at least 3 topics");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, profession, interests }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to save profile");
                setLoading(false);
                return;
            }

            // Update session to reflect onboarded status
            await update({ onboarded: true, name });

            router.push("/");
            router.refresh();
        } catch (err) {
            setError("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        {step === 1 && "What's your name?"}
                        {step === 2 && "What do you do?"}
                        {step === 3 && "What are you interested in?"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Let's personalize your experience"}
                        {step === 2 && "Select your profession"}
                        {step === 3 && "Select at least 3 topics to curate your feed"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Name */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-lg py-6"
                                    autoFocus
                                />
                            </div>
                            <Button
                                className="w-full"
                                onClick={() => setStep(2)}
                                disabled={!name.trim()}
                            >
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Profession */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {PROFESSIONS.map((prof) => (
                                    <button
                                        key={prof}
                                        onClick={() => setProfession(prof)}
                                        className={cn(
                                            "px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                                            profession === prof
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        {prof}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!profession}
                                    className="flex-1"
                                >
                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Topics */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {TOPICS.map((topic) => (
                                    <button
                                        key={topic.id}
                                        onClick={() => handleTopicToggle(topic.id)}
                                        className={cn(
                                            "px-4 py-3 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                                            interests.includes(topic.id)
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <span>{topic.emoji}</span>
                                        <span className="flex-1 text-left">{topic.label}</span>
                                        {interests.includes(topic.id) && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                {interests.length}/3 selected
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading || interests.length < 3}
                                    className="flex-1"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Finish
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="flex justify-center gap-2 pt-4">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    "h-2 w-8 rounded-full transition-colors",
                                    s <= step ? "bg-primary" : "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
