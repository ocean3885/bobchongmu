
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';


interface MealRow {
    id: number;
    group_id: number;
    user_id: number;
    restaurant_name: string;
    date: string;
    total_amount: number;
    amount_per_person: number;
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ mealId: string }> }
) {
    try {
        const { mealId } = await context.params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        // Verify meal belongs to a group owned by user
        const meal = db.prepare(`
            SELECT m.*, g.user_id 
            FROM meals m 
            JOIN groups g ON m.group_id = g.id 
            WHERE m.id = ?
        `).get(mealId) as MealRow | undefined;

        if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
        if (meal.user_id !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const participants = db.prepare('SELECT member_id FROM meal_participants WHERE meal_id = ?').all(mealId) as { member_id: number }[];

        return NextResponse.json({
            ...meal,
            participantIds: participants.map(p => p.member_id)
        });

    } catch (error) {
        console.error('Failed to fetch meal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ mealId: string }> }
) {
    try {
        const { mealId } = await context.params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const meal = db.prepare(`
            SELECT m.*, g.user_id 
            FROM meals m 
            JOIN groups g ON m.group_id = g.id 
            WHERE m.id = ?
        `).get(mealId) as MealRow | undefined;

        if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
        if (meal.user_id !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const deleteTransaction = db.transaction(() => {
            // 1. Get current participants and amounts to refund
            const participants = db.prepare('SELECT member_id FROM meal_participants WHERE meal_id = ?').all(mealId) as { member_id: number }[];
            const amountPerPerson = meal.amount_per_person;
            const groupId = meal.group_id;

            // 2. Refund members
            const updateBalance = db.prepare('UPDATE members SET balance = balance + ? WHERE id = ?');
            for (const p of participants) {
                updateBalance.run(amountPerPerson, p.member_id);
            }

            // 3. Reverse overhead if any
            const participantCount = participants.length;
            const totalAmount = meal.total_amount;
            const overhead = (amountPerPerson * participantCount) - totalAmount;

            if (overhead > 0) {
                db.prepare('UPDATE groups SET overhead_balance = overhead_balance - ? WHERE id = ?').run(overhead, groupId);
            }

            // 4. Delete related records
            db.prepare('DELETE FROM transactions WHERE related_meal_id = ?').run(mealId);
            db.prepare('DELETE FROM meal_participants WHERE meal_id = ?').run(mealId);
            db.prepare('DELETE FROM meals WHERE id = ?').run(mealId);
        });

        deleteTransaction();
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Failed to delete meal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ mealId: string }> }
) {
    try {
        const { mealId } = await context.params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { restaurantName, date, totalAmount, amountPerPerson, participantIds } = await req.json();

        const meal = db.prepare(`
            SELECT m.*, g.user_id 
            FROM meals m 
            JOIN groups g ON m.group_id = g.id 
            WHERE m.id = ?
        `).get(mealId) as MealRow | undefined;

        if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
        if (meal.user_id !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const updateTransaction = db.transaction(() => {
            const groupId = meal.group_id;

            // --- REVERT OLD DATA ---
            const oldParticipants = db.prepare('SELECT member_id FROM meal_participants WHERE meal_id = ?').all(mealId) as { member_id: number }[];
            const oldAmountPerPerson = meal.amount_per_person;

            // Refund old members
            const refundBalance = db.prepare('UPDATE members SET balance = balance + ? WHERE id = ?');
            for (const p of oldParticipants) {
                refundBalance.run(oldAmountPerPerson, p.member_id);
            }

            // Reverse old overhead
            const oldParticipantCount = oldParticipants.length;
            const oldTotalAmount = meal.total_amount;
            const oldOverhead = (oldAmountPerPerson * oldParticipantCount) - oldTotalAmount;

            if (oldOverhead > 0) {
                db.prepare('UPDATE groups SET overhead_balance = overhead_balance - ? WHERE id = ?').run(oldOverhead, groupId);
            }

            // Delete old derived data
            db.prepare('DELETE FROM transactions WHERE related_meal_id = ?').run(mealId);
            db.prepare('DELETE FROM meal_participants WHERE meal_id = ?').run(mealId);


            // --- APPLY NEW DATA ---
            // Update meal record
            db.prepare(`
                UPDATE meals 
                SET restaurant_name = ?, date = ?, total_amount = ?, amount_per_person = ?
                WHERE id = ?
            `).run(restaurantName, date, totalAmount, amountPerPerson, mealId);

            // Insert new participants and charge them
            const insertParticipant = db.prepare('INSERT INTO meal_participants (meal_id, member_id) VALUES (?, ?)');
            const chargeBalance = db.prepare('UPDATE members SET balance = balance - ? WHERE id = ?');
            const insertTransaction = db.prepare(`
                INSERT INTO transactions (group_id, member_id, type, amount, note, related_meal_id)
                VALUES (?, ?, 'meal', ?, ?, ?)
            `);

            for (const memberId of participantIds) {
                insertParticipant.run(mealId, memberId);
                chargeBalance.run(amountPerPerson, memberId);
                insertTransaction.run(groupId, memberId, amountPerPerson, `${restaurantName} 식사`, mealId);
            }

            // Handle new overhead
            const overhead = (amountPerPerson * participantIds.length) - totalAmount;
            if (overhead > 0) {
                db.prepare('UPDATE groups SET overhead_balance = overhead_balance + ? WHERE id = ?').run(overhead, groupId);
                db.prepare(`
                    INSERT INTO transactions (group_id, type, amount, note, related_meal_id)
                    VALUES (?, 'overhead_accrual', ?, ?, ?)
                `).run(groupId, overhead, `${restaurantName} 식사 자투리`, mealId);
            }
        });

        updateTransaction();
        return NextResponse.json({ success: true, mealId });

    } catch (error) {
        console.error('Failed to update meal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
