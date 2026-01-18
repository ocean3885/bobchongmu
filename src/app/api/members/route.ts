import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { searchParams } = new URL(req.url);
        const groupId = searchParams.get('groupId');
        if (!groupId) {
            return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
        }

        // Verify group ownership
        const group = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(groupId, userId);
        if (!group) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const members = db.prepare(`
            SELECT * FROM members 
            WHERE group_id = ? 
            ORDER BY is_active DESC, joined_at ASC
        `).all(groupId);
        return NextResponse.json(members);
    } catch (error) {
        console.error('Failed to fetch members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { groupId, name, balance } = await req.json();
        if (!groupId || !name) {
            return NextResponse.json({ error: 'groupId and name are required' }, { status: 400 });
        }

        // Verify group ownership
        const group = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(groupId, userId);
        if (!group) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const initialBalance = balance ? parseInt(balance) : 0;

        const createMemberTransaction = db.transaction(() => {
            const info = db.prepare('INSERT INTO members (group_id, name, balance) VALUES (?, ?, ?)').run(groupId, name, initialBalance);
            const newMemberId = info.lastInsertRowid;

            if (initialBalance > 0) {
                db.prepare(`
                    INSERT INTO transactions (group_id, member_id, type, amount, note)
                    VALUES (?, ?, 'deposit', ?, '초기 예치금')
                `).run(groupId, newMemberId, initialBalance);
            }
            return { id: newMemberId };
        });

        const result = createMemberTransaction();
        return NextResponse.json({ id: result.id, name, groupId, balance: initialBalance });
    } catch (error) {
        console.error('Failed to create member:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { memberId, isActive } = await req.json();
        if (!memberId) {
            return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
        }

        // Verify member belongs to a group owned by the user
        const member = db.prepare(`
            SELECT m.id FROM members m 
            JOIN groups g ON m.group_id = g.id 
            WHERE m.id = ? AND g.user_id = ?
        `).get(memberId, userId);

        if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const withdrawnAt = isActive ? null : new Date().toISOString();

        db.prepare('UPDATE members SET is_active = ?, withdrawn_at = ? WHERE id = ?')
            .run(isActive ? 1 : 0, withdrawnAt, memberId);

        return NextResponse.json({ success: true, memberId, isActive });
    } catch (error) {
        console.error('Failed to update member status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
