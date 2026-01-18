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
        const limit = searchParams.get('limit') || 5;

        if (!groupId) {
            return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
        }

        // Verify group ownership
        const group = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(groupId, userId);
        if (!group) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const meals = db.prepare(`
            SELECT m.*, GROUP_CONCAT(mem.name) as participant_names
            FROM meals m
            LEFT JOIN meal_participants mp ON m.id = mp.meal_id
            LEFT JOIN members mem ON mp.member_id = mem.id
            WHERE m.group_id = ? 
            GROUP BY m.id
            ORDER BY m.date DESC, m.id DESC
            LIMIT ?
        `).all(groupId, Number(limit));

        return NextResponse.json(meals);
    } catch (error) {
        console.error('Failed to fetch meals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { groupId, restaurantName, date, totalAmount, amountPerPerson, participantIds } = await req.json();

        if (!groupId || !restaurantName || !date || !totalAmount || !amountPerPerson || !participantIds || participantIds.length === 0) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Verify group ownership
        const group = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(groupId, userId);
        if (!group) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const executeMealRecord = db.transaction(() => {
            // 1. Create meal record
            const mealInfo = db.prepare(`
                INSERT INTO meals (group_id, restaurant_name, date, total_amount, amount_per_person)
                VALUES (?, ?, ?, ?, ?)
            `).run(groupId, restaurantName, date, totalAmount, amountPerPerson);

            const mealId = mealInfo.lastInsertRowid;

            // 2. Create meal participants and transactions for each participant
            const insertParticipant = db.prepare('INSERT INTO meal_participants (meal_id, member_id) VALUES (?, ?)');
            const updateBalance = db.prepare('UPDATE members SET balance = balance - ? WHERE id = ?');
            const insertTransaction = db.prepare(`
                INSERT INTO transactions (group_id, member_id, type, amount, note, related_meal_id)
                VALUES (?, ?, 'meal', ?, ?, ?)
            `);

            for (const memberId of participantIds) {
                insertParticipant.run(mealId, memberId);
                updateBalance.run(amountPerPerson, memberId);
                insertTransaction.run(groupId, memberId, amountPerPerson, `${restaurantName} 식사`, mealId);
            }

            return { id: mealId };
        });

        const result = executeMealRecord();
        return NextResponse.json({ success: true, mealId: result.id });
    } catch (error) {
        console.error('Failed to add meal record:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
