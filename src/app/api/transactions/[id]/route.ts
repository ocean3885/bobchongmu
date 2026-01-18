
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

interface Transaction {
    id: number;
    group_id: number;
    member_id: number;
    type: string;
    amount: number;
    note: string;
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { amount, note } = await req.json();

        // 1. Fetch transaction
        const transaction = db.prepare(`
            SELECT t.* 
            FROM transactions t
            JOIN groups g ON t.group_id = g.id
            WHERE t.id = ? AND g.user_id = ?
        `).get(id, userId) as Transaction | undefined;

        if (!transaction) return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });

        // Only allow updating 'deposit' or simple custom transactions for now
        // prevent editing 'meal' or 'overhead_usage' which are complex
        if (transaction.type !== 'deposit') {
            return NextResponse.json({ error: 'Only deposit transactions can be edited directly' }, { status: 400 });
        }

        const oldAmount = transaction.amount;
        const newAmount = parseInt(amount);

        const updateTransaction = db.transaction(() => {
            // Revert old balance effect
            db.prepare('UPDATE members SET balance = balance - ? WHERE id = ?').run(oldAmount, transaction.member_id);

            // Apply new balance effect
            db.prepare('UPDATE members SET balance = balance + ? WHERE id = ?').run(newAmount, transaction.member_id);

            // Update transaction record
            db.prepare('UPDATE transactions SET amount = ?, note = ? WHERE id = ?').run(newAmount, note, id);
        });

        updateTransaction();

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Failed to update transaction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        // 1. Fetch transaction
        const transaction = db.prepare(`
            SELECT t.* 
            FROM transactions t
            JOIN groups g ON t.group_id = g.id
            WHERE t.id = ? AND g.user_id = ?
        `).get(id, userId) as Transaction | undefined;

        if (!transaction) return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });

        // Only allow deleting 'deposit' transactions for now
        if (transaction.type !== 'deposit') {
            return NextResponse.json({ error: 'Only deposit transactions can be deleted directly' }, { status: 400 });
        }

        const deleteTransaction = db.transaction(() => {
            // Revert balance effect (subtract deposit amount)
            db.prepare('UPDATE members SET balance = balance - ? WHERE id = ?').run(transaction.amount, transaction.member_id);

            // Delete transaction record
            db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
        });

        deleteTransaction();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
