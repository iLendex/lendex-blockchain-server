import { relations } from "drizzle-orm/relations";
import { launchUser, launchBlockchainUser, launchLoan } from "./schema";

export const launchBlockchainUserRelations = relations(launchBlockchainUser, ({one, many}) => ({
	launchUser: one(launchUser, {
		fields: [launchBlockchainUser.userId],
		references: [launchUser.id]
	}),
	launchLoans_creatorAddress: many(launchLoan, {
		relationName: "launchLoan_creatorAddress_launchBlockchainUser_walletAddress"
	}),
	launchLoans_ethereumLenderAddress: many(launchLoan, {
		relationName: "launchLoan_ethereumLenderAddress_launchBlockchainUser_walletAddress"
	}),
}));

export const launchUserRelations = relations(launchUser, ({many}) => ({
	launchBlockchainUsers: many(launchBlockchainUser),
	launchLoans: many(launchLoan),
}));

export const launchLoanRelations = relations(launchLoan, ({one}) => ({
	launchBlockchainUser_creatorAddress: one(launchBlockchainUser, {
		fields: [launchLoan.creatorAddress],
		references: [launchBlockchainUser.walletAddress],
		relationName: "launchLoan_creatorAddress_launchBlockchainUser_walletAddress"
	}),
	launchBlockchainUser_ethereumLenderAddress: one(launchBlockchainUser, {
		fields: [launchLoan.ethereumLenderAddress],
		references: [launchBlockchainUser.walletAddress],
		relationName: "launchLoan_ethereumLenderAddress_launchBlockchainUser_walletAddress"
	}),
	launchUser: one(launchUser, {
		fields: [launchLoan.userId],
		references: [launchUser.id]
	}),
}));