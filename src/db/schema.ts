import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "player",
  "captain",
  "admin",
]);

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "published",
  "registration_open",
  "registration_closed",
  "live",
  "completed",
  "cancelled",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "waitlisted",
  "checked_in",
]);

export const rosterRoleEnum = pgEnum("roster_role", [
  "starter",
  "substitute",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "ready",
  "live",
  "reported",
  "disputed",
  "completed",
]);

export const bracketLaneEnum = pgEnum("bracket_lane", [
  "upper",
  "lower",
  "grand_final",
  "grand_final_reset",
]);

export const bracketSlotEnum = pgEnum("bracket_slot", ["team_a", "team_b"]);

export const tournamentStandingStatusEnum = pgEnum("tournament_standing_status", [
  "active",
  "lower_bracket",
  "eliminated",
  "runner_up",
  "champion",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email"),
    emailVerified: timestamp("email_verified", {
      withTimezone: true,
      mode: "date",
    }),
    image: text("image"),
    role: userRoleEnum("role").default("player").notNull(),
    riotId: varchar("riot_id", { length: 32 }),
    riotIdNormalized: varchar("riot_id_normalized", { length: 64 }),
    discordId: varchar("discord_id", { length: 64 }),
    googleId: varchar("google_id", { length: 128 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_riot_id_normalized_unique").on(table.riotIdNormalized),
    index("users_role_idx").on(table.role),
    check(
      "users_riot_id_format_chk",
      sql`${table.riotId} IS NULL OR ${table.riotId} ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{2,15}#[A-Za-z0-9]{3,5}$'`,
    ),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    captainId: uuid("captain_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 48 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    logoUrl: text("logo_url"),
    region: varchar("region", { length: 8 }).default("LAN").notNull(),
    metadata: jsonb("metadata").$type<{
      social?: {
        discord?: string;
        x?: string;
        twitch?: string;
      };
      brandColor?: string;
    }>(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("teams_slug_unique").on(table.slug),
    index("teams_captain_id_idx").on(table.captainId),
    check("teams_name_min_length_chk", sql`char_length(${table.name}) >= 3`),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    role: rosterRoleEnum("role").notNull(),
    position: integer("position").notNull(),
    riotId: varchar("riot_id", { length: 32 }).notNull(),
    riotIdNormalized: varchar("riot_id_normalized", { length: 64 }).notNull(),
    isCaptain: boolean("is_captain").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("team_members_team_position_unique").on(table.teamId, table.position),
    uniqueIndex("team_members_team_riot_unique").on(table.teamId, table.riotIdNormalized),
    index("team_members_user_id_idx").on(table.userId),
    check("team_members_position_range_chk", sql`${table.position} BETWEEN 1 AND 6`),
    check(
      "team_members_riot_id_format_chk",
      sql`${table.riotId} ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{2,15}#[A-Za-z0-9]{3,5}$'`,
    ),
  ],
);

export const tournaments = pgTable(
  "tournaments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    title: varchar("title", { length: 96 }).notNull(),
    slug: varchar("slug", { length: 96 }).notNull(),
    game: varchar("game", { length: 24 }).default("valorant").notNull(),
    region: varchar("region", { length: 8 }).default("LAN").notNull(),
    status: tournamentStatusEnum("status").default("draft").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    registrationOpensAt: timestamp("registration_opens_at", { withTimezone: true }).notNull(),
    registrationClosesAt: timestamp("registration_closes_at", { withTimezone: true }).notNull(),
    maxTeams: integer("max_teams").default(16).notNull(),
    prizePoolAmount: numeric("prize_pool_amount", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    prizePoolCurrency: varchar("prize_pool_currency", { length: 3 }).default("USD").notNull(),
    rulesUrl: text("rules_url"),
    heroVideoUrl: text("hero_video_url"),
    coverImageUrl: text("cover_image_url"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tournaments_slug_unique").on(table.slug),
    index("tournaments_status_starts_at_idx").on(table.status, table.startsAt),
    check("tournaments_max_teams_chk", sql`${table.maxTeams} > 1`),
    check(
      "tournaments_registration_window_chk",
      sql`${table.registrationOpensAt} < ${table.registrationClosesAt} AND ${table.registrationClosesAt} <= ${table.startsAt}`,
    ),
  ],
);

export const tournamentRegistrations = pgTable(
  "tournament_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    status: registrationStatusEnum("status").default("pending_review").notNull(),
    seed: integer("seed"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tournament_registrations_team_tournament_unique").on(table.teamId, table.tournamentId),
    index("tournament_registrations_status_idx").on(table.status),
  ],
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    matchNumber: integer("match_number").notNull(),
    bestOf: integer("best_of").default(1).notNull(),
    bracket: bracketLaneEnum("bracket"),
    bracketRound: integer("bracket_round"),
    bracketMatchNumber: integer("bracket_match_number"),
    nextMatchId: uuid("next_match_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
    nextMatchSlot: bracketSlotEnum("next_match_slot"),
    loserNextMatchId: uuid("loser_next_match_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
    loserNextMatchSlot: bracketSlotEnum("loser_next_match_slot"),
    sourceMatchAId: uuid("source_match_a_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
    sourceMatchBId: uuid("source_match_b_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
    teamAId: uuid("team_a_id").references(() => teams.id, { onDelete: "set null" }),
    teamBId: uuid("team_b_id").references(() => teams.id, { onDelete: "set null" }),
    winnerTeamId: uuid("winner_team_id").references(() => teams.id, { onDelete: "set null" }),
    status: matchStatusEnum("status").default("scheduled").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    scoreA: integer("score_a").default(0).notNull(),
    scoreB: integer("score_b").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("matches_tournament_round_number_unique").on(table.tournamentId, table.round, table.matchNumber),
    index("matches_tournament_status_idx").on(table.tournamentId, table.status),
    index("matches_bracket_position_idx").on(
      table.tournamentId,
      table.bracket,
      table.bracketRound,
      table.bracketMatchNumber,
    ),
    index("matches_next_match_idx").on(table.nextMatchId),
    index("matches_loser_next_match_idx").on(table.loserNextMatchId),
    check("matches_best_of_chk", sql`${table.bestOf} IN (1, 3, 5)`),
  ],
);

export const tournamentTeamStandings = pgTable(
  "tournament_team_standings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    seed: integer("seed").notNull(),
    wins: integer("wins").default(0).notNull(),
    losses: integer("losses").default(0).notNull(),
    status: tournamentStandingStatusEnum("status").default("active").notNull(),
    lastMatchId: uuid("last_match_id").references(() => matches.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tournament_team_standings_team_unique").on(table.tournamentId, table.teamId),
    index("tournament_team_standings_rank_idx").on(
      table.tournamentId,
      table.status,
      table.wins,
      table.losses,
      table.seed,
    ),
  ],
);

export const tournamentPlayerSnapshots = pgTable(
  "tournament_player_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    riotId: varchar("riot_id", { length: 32 }).notNull(),
    riotIdNormalized: varchar("riot_id_normalized", { length: 64 }).notNull(),
    role: rosterRoleEnum("role").notNull(),
    isCaptain: boolean("is_captain").default(false).notNull(),
    seed: integer("seed").notNull(),
    ...timestamps,
  },
  (table) => [
    index("tournament_player_snapshots_tournament_idx").on(table.tournamentId),
    index("tournament_player_snapshots_user_idx").on(table.userId),
    index("tournament_player_snapshots_riot_idx").on(table.riotIdNormalized),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  ownedTeams: many(teams),
  teamMemberships: many(teamMembers),
  createdTournaments: many(tournaments),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  captain: one(users, {
    fields: [teams.captainId],
    references: [users.id],
  }),
  members: many(teamMembers),
  registrations: many(tournamentRegistrations),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tournaments.createdById],
    references: [users.id],
  }),
  registrations: many(tournamentRegistrations),
  matches: many(matches),
  standings: many(tournamentTeamStandings),
  playerSnapshots: many(tournamentPlayerSnapshots),
}));

export const tournamentRegistrationsRelations = relations(
  tournamentRegistrations,
  ({ one }) => ({
    tournament: one(tournaments, {
      fields: [tournamentRegistrations.tournamentId],
      references: [tournaments.id],
    }),
    team: one(teams, {
      fields: [tournamentRegistrations.teamId],
      references: [teams.id],
    }),
  }),
);

export const matchesRelations = relations(matches, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [matches.tournamentId],
    references: [tournaments.id],
  }),
  teamA: one(teams, {
    fields: [matches.teamAId],
    references: [teams.id],
    relationName: "match_team_a",
  }),
  teamB: one(teams, {
    fields: [matches.teamBId],
    references: [teams.id],
    relationName: "match_team_b",
  }),
  winner: one(teams, {
    fields: [matches.winnerTeamId],
    references: [teams.id],
    relationName: "match_winner",
  }),
  nextMatch: one(matches, {
    fields: [matches.nextMatchId],
    references: [matches.id],
    relationName: "match_next",
  }),
  loserNextMatch: one(matches, {
    fields: [matches.loserNextMatchId],
    references: [matches.id],
    relationName: "match_loser_next",
  }),
  sourceMatchA: one(matches, {
    fields: [matches.sourceMatchAId],
    references: [matches.id],
    relationName: "match_source_a",
  }),
  sourceMatchB: one(matches, {
    fields: [matches.sourceMatchBId],
    references: [matches.id],
    relationName: "match_source_b",
  }),
}));

export const tournamentTeamStandingsRelations = relations(tournamentTeamStandings, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentTeamStandings.tournamentId],
    references: [tournaments.id],
  }),
  team: one(teams, {
    fields: [tournamentTeamStandings.teamId],
    references: [teams.id],
  }),
  lastMatch: one(matches, {
    fields: [tournamentTeamStandings.lastMatchId],
    references: [matches.id],
  }),
}));

export const tournamentPlayerSnapshotsRelations = relations(tournamentPlayerSnapshots, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentPlayerSnapshots.tournamentId],
    references: [tournaments.id],
  }),
  team: one(teams, {
    fields: [tournamentPlayerSnapshots.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [tournamentPlayerSnapshots.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TournamentRegistration = typeof tournamentRegistrations.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type TournamentTeamStanding = typeof tournamentTeamStandings.$inferSelect;
export type NewTournamentTeamStanding = typeof tournamentTeamStandings.$inferInsert;
export type TournamentPlayerSnapshot = typeof tournamentPlayerSnapshots.$inferSelect;
export type NewTournamentPlayerSnapshot = typeof tournamentPlayerSnapshots.$inferInsert;
