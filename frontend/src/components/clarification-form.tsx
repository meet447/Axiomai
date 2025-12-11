import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowRight, HelpCircle } from "lucide-react";

interface ClarificationFormProps {
    questions: string[];
    originalQuery: string;
    onSubmit: (query: string, answers: string[]) => void;
}

export function ClarificationForm({
    questions,
    originalQuery,
    onSubmit,
}: ClarificationFormProps) {
    const [answers, setAnswers] = useState<string[]>(
        new Array(questions.length).fill("")
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (answers.some((a) => a.trim() === "")) return; // specific validation? or allow empty
        onSubmit(originalQuery, answers);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto my-4 border-2 border-primary/20 bg-muted/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    I need a few details to give you a pro answer
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {questions.map((q, idx) => (
                        <div key={idx} className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {q}
                            </label>
                            <Input
                                value={answers[idx]}
                                onChange={(e) => {
                                    const newAnswers = [...answers];
                                    newAnswers[idx] = e.target.value;
                                    setAnswers(newAnswers);
                                }}
                                placeholder="Type your answer..."
                                className="bg-background"
                                autoFocus={idx === 0}
                            />
                        </div>
                    ))}
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={answers.some((a) => !a.trim())}>
                            Continue Research <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
