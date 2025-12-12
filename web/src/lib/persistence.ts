import { prisma } from './db';
import { SearchResult } from './search';

export async function saveChat(
    userId: string,
    threadId: number | undefined,
    query: string,
    response: string,
    sources: SearchResult[] = [],
    images: string[] = []
): Promise<number> {
    try {
        let currentThreadId = threadId;

        if (!currentThreadId) {
            // Check if user exists (for authenticated users)
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });

            const thread = await prisma.thread.create({
                data: {
                    title: query.slice(0, 50),
                    // Only connect user if they exist (authenticated users)
                    ...(existingUser ? { user: { connect: { id: userId } } } : { userId: 'anonymous' }),
                    messages: {
                        create: {
                            role: 'user',
                            content: query
                        }
                    }
                }
            });
            currentThreadId = thread.id;
        } else {
            // Append user query to existing thread
            await prisma.message.create({
                data: {
                    role: 'user',
                    content: query,
                    threadId: currentThreadId
                }
            });
        }

        // Append assistant response
        await prisma.message.create({
            data: {
                role: 'assistant',
                content: response,
                sources: JSON.stringify({ sources, images }),
                threadId: currentThreadId
            }
        });

        return currentThreadId;
    } catch (e) {
        console.error("Failed to save chat:", e);
        return threadId || -1;
    }
}
