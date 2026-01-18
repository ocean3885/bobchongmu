import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const group = db.prepare('SELECT * FROM groups WHERE id = ? AND user_id = ?').get(id, userId);
            return NextResponse.json(group);
        }

        const groups = db.prepare('SELECT * FROM groups WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        return NextResponse.json(groups);
    } catch (error) {
        console.error('Failed to fetch groups:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        const info = db.prepare('INSERT INTO groups (name, user_id) VALUES (?, ?)').run(name, userId);
        return NextResponse.json({ id: info.lastInsertRowid, name });
    } catch (error) {
        console.error('Failed to create group:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { id, name } = await req.json();
        if (!id || !name) {
            return NextResponse.json({ error: 'id and name are required' }, { status: 400 });
        }

        db.prepare('UPDATE groups SET name = ? WHERE id = ? AND user_id = ?').run(name, id, userId);
        return NextResponse.json({ success: true, id, name });
    } catch (error) {
        console.error('Failed to update group:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
