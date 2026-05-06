CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'ready', 'live', 'reported', 'disputed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'waitlisted', 'checked_in');--> statement-breakpoint
CREATE TYPE "public"."roster_role" AS ENUM('starter', 'substitute');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'published', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('player', 'captain', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"match_number" integer NOT NULL,
	"best_of" integer DEFAULT 1 NOT NULL,
	"team_a_id" uuid,
	"team_b_id" uuid,
	"winner_team_id" uuid,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"score_a" integer DEFAULT 0 NOT NULL,
	"score_b" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_best_of_chk" CHECK ("matches"."best_of" IN (1, 3, 5))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid,
	"role" "roster_role" NOT NULL,
	"position" integer NOT NULL,
	"riot_id" varchar(32) NOT NULL,
	"riot_id_normalized" varchar(64) NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_position_range_chk" CHECK ("team_members"."position" BETWEEN 1 AND 6),
	CONSTRAINT "team_members_riot_id_format_chk" CHECK ("team_members"."riot_id" ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{2,15}#[A-Za-z0-9]{3,5}$')
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"captain_id" uuid NOT NULL,
	"name" varchar(48) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"logo_url" text,
	"region" varchar(8) DEFAULT 'LAN' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_min_length_chk" CHECK (char_length("teams"."name") >= 3)
);
--> statement-breakpoint
CREATE TABLE "tournament_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"status" "registration_status" DEFAULT 'pending_review' NOT NULL,
	"seed" integer,
	"checked_in_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by_id" uuid,
	"title" varchar(96) NOT NULL,
	"slug" varchar(96) NOT NULL,
	"game" varchar(24) DEFAULT 'valorant' NOT NULL,
	"region" varchar(8) DEFAULT 'LAN' NOT NULL,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"registration_opens_at" timestamp with time zone NOT NULL,
	"registration_closes_at" timestamp with time zone NOT NULL,
	"max_teams" integer DEFAULT 16 NOT NULL,
	"prize_pool_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"prize_pool_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"rules_url" text,
	"hero_video_url" text,
	"cover_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_max_teams_chk" CHECK ("tournaments"."max_teams" > 1),
	CONSTRAINT "tournaments_registration_window_chk" CHECK ("tournaments"."registration_opens_at" < "tournaments"."registration_closes_at" AND "tournaments"."registration_closes_at" <= "tournaments"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'player' NOT NULL,
	"riot_id" varchar(32),
	"riot_id_normalized" varchar(64),
	"discord_id" varchar(64),
	"google_id" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_riot_id_format_chk" CHECK ("users"."riot_id" IS NULL OR "users"."riot_id" ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{2,15}#[A-Za-z0-9]{3,5}$')
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_captain_id_users_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_tournament_round_number_unique" ON "matches" USING btree ("tournament_id","round","match_number");--> statement-breakpoint
CREATE INDEX "matches_tournament_status_idx" ON "matches" USING btree ("tournament_id","status");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_position_unique" ON "team_members" USING btree ("team_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_riot_unique" ON "team_members" USING btree ("team_id","riot_id_normalized");--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_unique" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "teams_captain_id_idx" ON "teams" USING btree ("captain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_registrations_team_tournament_unique" ON "tournament_registrations" USING btree ("team_id","tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_registrations_status_idx" ON "tournament_registrations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tournaments_slug_unique" ON "tournaments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tournaments_status_starts_at_idx" ON "tournaments" USING btree ("status","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_riot_id_normalized_unique" ON "users" USING btree ("riot_id_normalized");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");