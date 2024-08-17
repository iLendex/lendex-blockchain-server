DO $$ BEGIN
 CREATE TYPE "public"."blockchain" AS ENUM('cdn', 'eth', 'sol');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."loan" AS ENUM('tokenLocked', 'borrowMinted', 'awaitingClaim', 'awaitingPay', 'defaulted', 'processingAcceptLoan', 'processingPayBackLoan');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "launch_blockchain_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"blockchain" "blockchain" NOT NULL,
	"wallet_address" text NOT NULL,
	"unique_address" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "launch_blockchain_user_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "launch_loan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" text NOT NULL,
	"ref_token" text,
	"contract_address" text NOT NULL,
	"amount" bigint NOT NULL,
	"duration" bigint NOT NULL,
	"apr" numeric(5, 2) NOT NULL,
	"creator_address" text NOT NULL,
	"ethereum_lender_address" text,
	"cardano_borrower_address" text NOT NULL,
	"cardano_lender_address" text,
	"state" "loan" NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL,
	"cardano_datum" text,
	"cardano_tx_hash" text,
	"payback_amount" bigint,
	"cardano_asset_name" text,
	"accept_loan_request_id" text,
	"pay_debt_request_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "launch_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256),
	"nonce" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "launch_blockchain_user" ADD CONSTRAINT "launch_blockchain_user_user_id_launch_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."launch_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "launch_loan" ADD CONSTRAINT "launch_loan_user_id_launch_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."launch_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "launch_loan" ADD CONSTRAINT "launch_loan_creator_address_launch_blockchain_user_wallet_address_fk" FOREIGN KEY ("creator_address") REFERENCES "public"."launch_blockchain_user"("wallet_address") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "launch_loan" ADD CONSTRAINT "launch_loan_ethereum_lender_address_launch_blockchain_user_wallet_address_fk" FOREIGN KEY ("ethereum_lender_address") REFERENCES "public"."launch_blockchain_user"("wallet_address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "launch_blockchain_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unique_identifier_idx" ON "launch_blockchain_user" USING btree ("unique_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_address_idx" ON "launch_blockchain_user" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_user_id_idx" ON "launch_loan" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_asset_id_idx" ON "launch_loan" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_contract_address_idx" ON "launch_loan" USING btree ("contract_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_creator_address_idx" ON "launch_loan" USING btree ("creator_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loan_ethereum_lender_address_idx" ON "launch_loan" USING btree ("ethereum_lender_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "launch_user" USING btree ("name");