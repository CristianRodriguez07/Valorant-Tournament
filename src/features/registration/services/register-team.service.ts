import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  teamMembers,
  teams,
  tournamentRegistrations,
  tournaments,
  users,
} from "@/db/schema";
import { normalizeRiotId } from "@/lib/validators/riot-id";
import { slugify } from "@/lib/utils";

import type { RosterPlayerInput } from "../schemas";
import { ACTIVE_REGISTRATION_STATUSES } from "../status";

export class RegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationError";
  }
}

type RegisterTeamInput = {
  captainId: string;
  tournamentSlug: string;
  teamName: string;
  logoUrl: string | null;
  players: RosterPlayerInput[];
};

export async function registerTeam(input: RegisterTeamInput): Promise<{ teamId: string; registrationId: string }> {
  return db.transaction(async (tx) => {
    const tournament = await tx.query.tournaments.findFirst({
      where: eq(tournaments.slug, input.tournamentSlug),
    });

    if (!tournament) {
      throw new RegistrationError("El torneo no existe.");
    }

    if (tournament.status !== "registration_open") {
      throw new RegistrationError("Las inscripciones no están abiertas para este torneo.");
    }

    const now = new Date();
    if (now < tournament.registrationOpensAt || now > tournament.registrationClosesAt) {
      throw new RegistrationError("La ventana de registro no está activa.");
    }

    const [existingActiveRegistration] = await tx
      .select({ id: tournamentRegistrations.id })
      .from(tournamentRegistrations)
      .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
      .where(
        and(
          eq(tournamentRegistrations.tournamentId, tournament.id),
          eq(teams.captainId, input.captainId),
          inArray(tournamentRegistrations.status, [...ACTIVE_REGISTRATION_STATUSES]),
        ),
      )
      .limit(1);

    if (existingActiveRegistration) {
      throw new RegistrationError("Ya tienes una inscripción activa para este torneo.");
    }

    const [registrationCount] = await tx
      .select({ value: count() })
      .from(tournamentRegistrations)
      .where(
        and(
          eq(tournamentRegistrations.tournamentId, tournament.id),
          inArray(tournamentRegistrations.status, ["pending_review", "approved", "checked_in"]),
        ),
      );

    if ((registrationCount?.value ?? 0) >= tournament.maxTeams) {
      throw new RegistrationError("El torneo ya alcanzó el máximo de equipos.");
    }

    const slugBase = slugify(input.teamName) || "team";
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;

    const [team] = await tx
      .insert(teams)
      .values({
        captainId: input.captainId,
        name: input.teamName,
        slug,
        logoUrl: input.logoUrl,
      })
      .returning({ id: teams.id });

    if (!team) {
      throw new RegistrationError("No se pudo crear el equipo.");
    }

    await tx.insert(teamMembers).values(
      input.players.map((player) => ({
        teamId: team.id,
        role: player.role,
        position: player.position,
        riotId: player.riotId,
        riotIdNormalized: normalizeRiotId(player.riotId).toLowerCase(),
        isCaptain: player.position === 1,
        userId: player.position === 1 ? input.captainId : null,
      })),
    );

    const captainPlayer = input.players.find((player) => player.position === 1);
    if (captainPlayer) {
      await tx
        .update(users)
        .set({
          role: "captain",
          riotId: captainPlayer.riotId,
          riotIdNormalized: normalizeRiotId(captainPlayer.riotId).toLowerCase(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.captainId));
    }

    const [registration] = await tx
      .insert(tournamentRegistrations)
      .values({
        tournamentId: tournament.id,
        teamId: team.id,
        status: "pending_review",
      })
      .returning({ id: tournamentRegistrations.id });

    if (!registration) {
      throw new RegistrationError("No se pudo crear la inscripción.");
    }

    return {
      teamId: team.id,
      registrationId: registration.id,
    };
  });
}
