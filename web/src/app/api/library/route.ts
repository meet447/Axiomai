import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const collections = await prisma.collection.findMany({
        where: { userId },
        include: { _count: { select: { threads: true } } }
    });
    return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    const collection = await prisma.collection.create({
        data: { name, userId }
    });
    return NextResponse.json(collection);
}
