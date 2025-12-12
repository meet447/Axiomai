import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const threads = await prisma.thread.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: 50,
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Format for frontend
        const snapshots = threads.map(t => ({
            id: t.id,
            title: t.title,
            date: t.updatedAt.toISOString(),
            preview: t.messages[0]?.content.slice(0, 100) || "Empty thread"
        }));

        return NextResponse.json({ snapshots });
    } catch (error) {
        console.error("History fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
