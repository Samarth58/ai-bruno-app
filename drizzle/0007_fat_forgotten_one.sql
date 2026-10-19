CREATE TABLE "password_reset_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"otp_hash" text NOT NULL,
	"otp_expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"resend_cooldown_expires_at" timestamp with time zone NOT NULL,
	"otp_verified_at" timestamp with time zone,
	"reset_token_hash" text,
	"reset_token_expires_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_challenges" ADD CONSTRAINT "password_reset_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "password_reset_challenges_user_id_idx" ON "password_reset_challenges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_challenges_email_idx" ON "password_reset_challenges" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_challenges_reset_token_hash_unique" ON "password_reset_challenges" USING btree ("reset_token_hash") WHERE "password_reset_challenges"."reset_token_hash" IS NOT NULL;