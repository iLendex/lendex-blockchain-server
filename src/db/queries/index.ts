import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { loanTable, SelectLoan } from '../schema';

export async function getAllLoans(): Promise<SelectLoan[]> {
    return await db.select().from(loanTable);
}

export async function getLoanByFliters(filters: {[key in keyof typeof loanTable]?: any}): Promise<SelectLoan> {
    const conditions = Object.entries(filters).map(([key, value]) => eq(loanTable[key], value));
    const whereClause = and(...conditions);
    const loans = await db.select().from(loanTable).where(whereClause);
    return loans[0];
}

export async function updateLoan(id: string, data: Partial<SelectLoan>) {
    await db.update(loanTable).set(data).where(eq(loanTable.id, id));
}