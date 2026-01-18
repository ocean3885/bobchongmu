import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get('memberId');
        const groupId = searchParams.get('groupId');

        if (memberId) {
            // Verify member ownership via group
            const member = db.prepare(`
                SELECT m.id FROM members m 
                JOIN groups g ON m.group_id = g.id 
                WHERE m.id = ? AND g.user_id = ?
            `).get(memberId, userId);
            if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const transactions = db.prepare('SELECT * FROM transactions WHERE member_id = ? ORDER BY created_at DESC').all(memberId);
            return NextResponse.json(transactions);
        }

        if (groupId) {
            // Verify group ownership
            const group = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(groupId, userId);
            if (!group) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            // Transactions where member_id is null (group-level like overhead usage) or all transactions for group
            const transactions = db.prepare('SELECT * FROM transactions WHERE group_id = ? ORDER BY created_at DESC').all(groupId);
            return NextResponse.json(transactions);
        }

        return NextResponse.json({ error: 'memberId or groupId is required' }, { status: 400 });
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { type, memberId, amount, note, groupId } = await req.json();

        if (type === 'deposit') {
            if (!memberId || !amount) {
                return NextResponse.json({ error: 'memberId and amount are required' }, { status: 400 });
            }

            // Verify member ownership
            const member = db.prepare(`
                SELECT m.id FROM members m 
                JOIN groups g ON m.group_id = g.id 
                WHERE m.id = ? AND g.user_id = ?
            `).get(memberId, userId);
            if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            db.transaction(() => {
                db.prepare('UPDATE members SET balance = balance + ? WHERE id = ?').run(amount, memberId);
                db.prepare(`
                    INSERT INTO transactions (group_id, member_id, type, amount, note)
                    VALUES ((SELECT group_id FROM members WHERE id = ?), ?, 'deposit', ?, ?)
                `).run(memberId, memberId, amount, note || 'Deposit');
            })();

            return NextResponse.json({ success: true });
        } else if (type === 'use_overhead') {
            if (!groupId || !amount) {
                return NextResponse.json({ error: 'groupId and amount are required for using overhead' }, { status: 400 });
            }

            // Verify group ownership
            const group = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(groupId, userId);
            if (!group) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const executeUseOverhead = db.transaction(() => {
                const groupData = db.prepare('SELECT overhead_balance FROM groups WHERE id = ?').get(groupId) as { overhead_balance: number };
                if (groupData.overhead_balance < amount) {
                    throw new Error('Insufficient overhead balance');
                }

                db.prepare('UPDATE groups SET overhead_balance = overhead_balance - ? WHERE id = ?').run(amount, groupId);
                db.prepare(`
                    INSERT INTO transactions (group_id, type, amount, note)
                    VALUES (?, 'overhead_usage', ?, ?)
                `).run(groupId, amount, note || 'Used overhead funds');
            });

            executeUseOverhead();
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    } catch (error) {
    }
}
