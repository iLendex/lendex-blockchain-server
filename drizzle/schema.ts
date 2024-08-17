import { pgTable, index, foreignKey, unique, pgEnum, uuid, text, timestamp, bigint, numeric, varchar } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const blockchain = pgEnum("blockchain", ['cdn', 'eth', 'sol'])
export const loan = pgEnum("loan", ['tokenLocked', 'borrowMinted', 'awaitingClaim', 'awaitingPay', 'defaulted', 'processingAcceptLoan', 'processingPayBackLoan', 'processingTokenLocked'])


export const launchBlockchainUser = pgTable("launch_blockchain_user", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull().references(() => launchUser.id, { onDelete: "cascade" } ),
	blockchain: blockchain("blockchain").notNull(),
	walletAddress: text("wallet_address").notNull(),
	uniqueAddress: text("unique_address"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		uniqueIdentifierIdx: index("unique_identifier_idx").using("btree", table.uniqueAddress),
		userIdIdx: index("user_id_idx").using("btree", table.userId),
		walletAddressIdx: index("wallet_address_idx").using("btree", table.walletAddress),
		launchBlockchainUserWalletAddressUnique: unique("launch_blockchain_user_wallet_address_unique").on(table.walletAddress),
	}
});

export const launchLoan = pgTable("launch_loan", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull().references(() => launchUser.id, { onDelete: "cascade" } ),
	assetId: text("asset_id").notNull(),
	refToken: text("ref_token"),
	contractAddress: text("contract_address").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint("amount", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	duration: bigint("duration", { mode: "number" }).notNull(),
	apr: numeric("apr", { precision: 5, scale:  2 }).notNull(),
	creatorAddress: text("creator_address").notNull().references(() => launchBlockchainUser.walletAddress, { onDelete: "cascade" } ),
	ethereumLenderAddress: text("ethereum_lender_address").references(() => launchBlockchainUser.walletAddress),
	cardanoBorrowerAddress: text("cardano_borrower_address").notNull(),
	cardanoLenderAddress: text("cardano_lender_address"),
	state: loan("state").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	cardanoDatum: text("cardano_datum"),
	cardanoTxHash: text("cardano_tx_hash"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	paybackAmount: bigint("payback_amount", { mode: "number" }),
	cardanoAssetName: text("cardano_asset_name"),
	acceptLoanRequestId: text("accept_loan_request_id"),
	payDebtRequestId: text("pay_debt_request_id"),
	assetLockedTxHash: text("asset_locked_tx_hash"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cardanoMinAdaUtxo: bigint("cardano_min_ada_utxo", { mode: "number" }),
},
(table) => {
	return {
		loanAssetIdIdx: index("loan_asset_id_idx").using("btree", table.assetId),
		loanContractAddressIdx: index("loan_contract_address_idx").using("btree", table.contractAddress),
		loanCreatorAddressIdx: index("loan_creator_address_idx").using("btree", table.creatorAddress),
		loanEthereumLenderAddressIdx: index("loan_ethereum_lender_address_idx").using("btree", table.ethereumLenderAddress),
		loanUserIdIdx: index("loan_user_id_idx").using("btree", table.userId),
	}
});

export const launchUser = pgTable("launch_user", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 256 }),
	nonce: text("nonce").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		nameIdx: index("name_idx").using("btree", table.name),
	}
});