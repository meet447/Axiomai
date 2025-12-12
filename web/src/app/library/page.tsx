"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/user";
import { Button } from "@/components/ui/button";
import { Plus, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Collection {
    id: number;
    name: string;
    _count: { threads: number };
}

export default function LibraryPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/library", { headers: { "x-user-id": getUserId() } })
            .then((res) => res.json())
            .then((data) => {
                if (data.collections) setCollections(data.collections);
                setLoading(false);
            });
    }, []);

    const createCollection = async () => {
        if (!newCollectionName.trim()) return;
        const res = await fetch("/api/library", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": getUserId() },
            body: JSON.stringify({ name: newCollectionName }),
        });
        if (res.ok) {
            const newCol = await res.json();
            setCollections([...collections, { ...newCol, _count: { threads: 0 } }]);
            setNewCollectionName("");
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Library</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Collection
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Collection</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2 mt-4">
                            <Input
                                placeholder="Collection Name"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                            />
                            <Button onClick={createCollection}>Create</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : collections.length === 0 ? (
                <div className="text-center text-muted-foreground mt-20">
                    <Folder className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>No collections yet. Create one to organize your threads.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {collections.map((col) => (
                        <div
                            key={col.id}
                            className="p-6 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Folder className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">{col.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {col._count.threads} threads
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
