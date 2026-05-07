CREATE TYPE "public"."bracket_lane" AS ENUM('upper', 'lower', 'grand_final', 'grand_final_reset');--> statement-breakpoint
CREATE TYPE "public"."bracket_slot" AS ENUM('team_a', 'team_b');--> statement-breakpoint
CREATE TYPE "public"."tournament_standing_status" AS ENUM('active', 'lower_bracket', 'eliminated', 'runner_up', 'champion');--> statement-breakpoint
CREATE TABLE "tournament_player_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid,
	"riot_id" varchar(32) NOT NULL,
	"riot_id_normalized" varchar(64) NOT NULL,
	"role" "roster_role" NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"seed" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_team_standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"seed" integer NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"status" "tournament_standing_status" DEFAULT 'active' NOT NULL,
	"last_match_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "bracket" "bracket_lane";--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "bracket_round" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "bracket_match_number" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "next_match_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "next_match_slot" "bracket_slot";--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "loser_next_match_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "loser_next_match_slot" "bracket_slot";--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "source_match_a_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "source_match_b_id" uuid;--> statement-breakpoint
ALTER TABLE "tournament_player_snapshots" ADD CONSTRAINT "tournament_player_snapshots_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_player_snapshots" ADD CONSTRAINT "tournament_player_snapshots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_player_snapshots" ADD CONSTRAINT "tournament_player_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_team_standings" ADD CONSTRAINT "tournament_team_standings_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_team_standings" ADD CONSTRAINT "tournament_team_standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_team_standings" ADD CONSTRAINT "tournament_team_standings_last_match_id_matches_id_fk" FOREIGN KEY ("last_match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tournament_player_snapshots_tournament_idx" ON "tournament_player_snapshots" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_player_snapshots_user_idx" ON "tournament_player_snapshots" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tournament_player_snapshots_riot_idx" ON "tournament_player_snapshots" USING btree ("riot_id_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_team_standings_team_unique" ON "tournament_team_standings" USING btree ("tournament_id","team_id");--> statement-breakpoint
CREATE INDEX "tournament_team_standings_rank_idx" ON "tournament_team_standings" USING btree ("tournament_id","status","wins","losses","seed");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_next_match_id_matches_id_fk" FOREIGN KEY ("next_match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_loser_next_match_id_matches_id_fk" FOREIGN KEY ("loser_next_match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_source_match_a_id_matches_id_fk" FOREIGN KEY ("source_match_a_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_source_match_b_id_matches_id_fk" FOREIGN KEY ("source_match_b_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_bracket_position_idx" ON "matches" USING btree ("tournament_id","bracket","bracket_round","bracket_match_number");--> statement-breakpoint
CREATE INDEX "matches_next_match_idx" ON "matches" USING btree ("next_match_id");--> statement-breakpoint
CREATE INDEX "matches_loser_next_match_idx" ON "matches" USING btree ("loser_next_match_id");