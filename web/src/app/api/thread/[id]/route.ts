import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const userId = req.headers.get('x-user-id');

        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
        }

        const thread = await prisma.thread.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!thread) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        // Security: Only allow access if thread is public OR user is the owner
        if (!thread.isPublic && thread.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const parsedMessages = thread.messages.map(msg => {
            let sources = [];
            let images = [];

            if (msg.sources) {
                try {
                    // msg.sources is defined as Json in schema, but we store it as a stringified JSON.
                    const sourcesStr = msg.sources as string;
                    const parsed = JSON.parse(sourcesStr);
                    // Handle both old format (array) and new format (object)
                    if (Array.isArray(parsed)) {
                        sources = parsed;
                    } else {
                        sources = parsed.sources || [];
                        images = parsed.images || [];
                    }
                } catch (e) {
                    // console.error("Failed to parse sources for message", msg.id);
                }
            }

            return {
                ...msg,
                sources: sources,
                images: images
            };
        });

        return NextResponse.json({
            messages: parsedMessages,
            thread_id: thread.id,
            title: thread.title
        });

    } catch (e) {
        console.error("Failed to fetch thread:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const userId = req.headers.get('x-user-id');

        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
        }

        const thread = await prisma.thread.findUnique({
            where: { id }
        });

        if (!thread) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        if (userId && thread.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.thread.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete thread:", error);
        return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
    }
}
