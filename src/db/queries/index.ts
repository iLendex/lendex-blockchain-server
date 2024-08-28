import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { loanTable, chainlinkSecretsTable, SelectLoan, SelectChainlinkSecrets, InsertChainlinkSecrets } from '../schema';

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

export async function getChainlinkSecrets(network: string, version: number): Promise<SelectChainlinkSecrets> {
    const secrets = await db.select().from(chainlinkSecretsTable).where(
        and(
            eq(chainlinkSecretsTable.network, network),
            eq(chainlinkSecretsTable.version, version)
        )
    );
    return secrets[0];
}

export async function insertChanlinkSecrets(secrets: string, encryptedUrl: string, network: string, version: number) {
    const item: InsertChainlinkSecrets = {
        secrets,
        network,
        version,
        encryptedUrl
    }
    await db.insert(chainlinkSecretsTable).values(item);
}