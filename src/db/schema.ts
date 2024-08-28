import { sql, relations } from "drizzle-orm";
import {
    index,
    pgTableCreator,
    serial,
    text,
    timestamp,
    varchar,
    uuid,
    pgEnum,
    bigint,
    pgTable,
    pgSchema,
    numeric,
} from "drizzle-orm/pg-core";

export const blockchainEnum = pgEnum('blockchain', ['cdn', 'eth', 'sol']);
export const loanStateEnum = pgEnum('loan', ['tokenLocked', 'borrowMinted', 'awaitingClaim', 'awaitingPay', 'defaulted', 'processingAcceptLoan', 'processingPayBackLoan', 'processingTokenLocked']);

//USER TABLE
export const userTable = pgTable(
    "launch_user",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name", { length: 256 }),
        nonce: text("nonce").notNull(),
        createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: timestamp('updated_at')
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (example) => ({
        nameIndex: index("name_idx").on(example.name),
    })
);

// BLOCKCHAIN USER TABLE
export const blockchainUserTable = pgTable(
    "launch_blockchain_user",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id").references(() => userTable.id, { onDelete: "cascade" }).notNull(),
        blockchain: blockchainEnum("blockchain").notNull(),
        walletAddress: text("wallet_address").notNull().unique(), // This is already unique, which is good
        uniqueAddress: text("unique_address"),
        createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: timestamp('updated_at')
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (example) => ({
        userIndex: index("user_id_idx").on(example.userId),
        uniqueIdentifierIndex: index("unique_identifier_idx").on(example.uniqueAddress),
        walletAddressIndex: index("wallet_address_idx").on(example.walletAddress), // Add this index
    })
);

// LOAN TABLE
export const loanTable = pgTable(
    "launch_loan",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id").references(() => userTable.id, { onDelete: "cascade" }).notNull(),
        assetId: text("asset_id").notNull(),
        assetTxHash: text("asset_locked_tx_hash"),
        refToken: text("ref_token"),
        contractAddress: text("contract_address").notNull(),
        amount: bigint("amount", { mode: 'number' }).notNull(),
        duration: bigint("duration", { mode: 'number' }).notNull(),
        apr: numeric("apr", { precision: 5, scale: 2 }).notNull(),
        creatorAddress: text("creator_address").references(() => blockchainUserTable.walletAddress, { onDelete: "cascade" }).notNull(),
        ethereumLenderAddress: text("ethereum_lender_address").references(() => blockchainUserTable.walletAddress),
        cardanoBorrowerAddress: text("cardano_borrower_address").notNull(),
        cardanoLenderAddress: text("cardano_lender_address"),
        state: loanStateEnum("state").notNull(),
        createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: timestamp('updated_at')
            .notNull()
            .$onUpdate(() => new Date()),
        cardanoDatum: text("cardano_datum"),
        cardanoTxHash: text("cardano_tx_hash"),
        paybackAmount: bigint("payback_amount", { mode: 'number' }),
        cardanoAssetName: text("cardano_asset_name"),
        cardanoMinAdaUtxo: bigint("cardano_min_ada_utxo", { mode: "number" }),
        acceptLoanRequestId: text("accept_loan_request_id"),
        payDebtRequestId: text("pay_debt_request_id"),
    },
    (example) => ({
        userIndex: index("loan_user_id_idx").on(example.userId),
        assetIndex: index("loan_asset_id_idx").on(example.assetId),
        contractAddressIndex: index("loan_contract_address_idx").on(example.contractAddress),
        creatorAddressIndex: index("loan_creator_address_idx").on(example.creatorAddress),
        ethereumLenderAddressIndex: index("loan_ethereum_lender_address_idx").on(example.ethereumLenderAddress),
    })
);

//USER TABLE
export const chainlinkSecretsTable = pgTable(
    "launch_chainlink_secrets",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        network: varchar("network", { length: 256 }).notNull(),
        secrets: text("secrets").notNull(),
        version: bigint("version", { mode: 'number' }).notNull(),
        encryptedUrl: text("encrypted_url").notNull(),
        createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (example) => ({
        nameIndex: index("network_idx").on(example.network),
    })
);

export type SelectLoan = typeof loanTable.$inferSelect;
export type SelectChainlinkSecrets = typeof chainlinkSecretsTable.$inferSelect;
export type InsertChainlinkSecrets = typeof chainlinkSecretsTable.$inferInsert;
export type LoanRequestId = typeof loanTable.acceptLoanRequestId | typeof loanTable.payDebtRequestId;
