import { z } from "zod";

import { normalizeRiotId, RIOT_ID_REGEX } from "@/lib/validators/riot-id";

export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export const riotIdSchema = z
  .string()
  .transform(normalizeRiotId)
  .pipe(
    z.string().regex(RIOT_ID_REGEX, "Usa el formato Riot ID: Player#LAN."),
  );

export const rosterPlayerSchema = z.object({
  position: z.number().int().min(1).max(6),
  role: z.enum(["starter", "substitute"]),
  riotId: riotIdSchema,
});

const teamRegistrationCoreShape = {
  tournamentSlug: z.string().min(1).default("valorant-ignition-cup"),
  teamName: z
    .string()
    .trim()
    .min(3, "El nombre del equipo debe tener al menos 3 caracteres.")
    .max(32, "Máximo 32 caracteres para mantener buen layout.")
    .regex(
      /^[\p{L}\p{N}][\p{L}\p{N}\s._-]*$/u,
      "Usa letras, números, espacios, punto, guion o underscore.",
    ),
  players: z.array(rosterPlayerSchema).length(6, "El roster debe tener 5 titulares y 1 suplente."),
};

function withRosterRules<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.superRefine((data, ctx) => {
    const maybePlayers = (data as { players?: unknown }).players;

    if (!Array.isArray(maybePlayers)) {
      return;
    }

    const players = maybePlayers as Array<{ role: string; riotId: string }>;
    const starters = players.filter((player) => player.role === "starter").length;
    const substitutes = players.filter((player) => player.role === "substitute").length;

    if (starters !== 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Debes registrar exactamente 5 jugadores titulares.",
      });
    }

    if (substitutes !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Debes registrar exactamente 1 suplente.",
      });
    }

    const seenRiotIds = new Map<string, number>();

    players.forEach((player, index) => {
      const normalized = normalizeRiotId(player.riotId).toLowerCase();
      const duplicatedAt = seenRiotIds.get(normalized);

      if (duplicatedAt !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["players", index, "riotId"],
          message: `Riot ID duplicado con el slot ${duplicatedAt + 1}.`,
        });
        return;
      }

      seenRiotIds.set(normalized, index);
    });
  });
}

export const teamRegistrationClientSchema = withRosterRules(
  z.object({
    ...teamRegistrationCoreShape,
    logo: z
      .custom<FileList>()
      .optional()
      .refine((files) => !files || files.length <= 1, "Solo puedes subir un logo.")
      .refine(
        (files) => !files || files.length === 0 || files.item(0)!.size <= MAX_LOGO_SIZE_BYTES,
        "El logo no puede superar 2 MB.",
      )
      .refine(
        (files) => !files || files.length === 0 || ACCEPTED_LOGO_TYPES.has(files.item(0)!.type),
        "Formato permitido: PNG, JPG, WEBP o SVG.",
      ),
  }),
);

export const teamRegistrationServerSchema = withRosterRules(
  z.object({
    ...teamRegistrationCoreShape,
    logo: z
      .instanceof(File)
      .nullable()
      .refine((file) => !file || file.size <= MAX_LOGO_SIZE_BYTES, "El logo no puede superar 2 MB.")
      .refine((file) => !file || ACCEPTED_LOGO_TYPES.has(file.type), "Formato de logo no permitido."),
  }),
);

export type RosterPlayerInput = z.infer<typeof rosterPlayerSchema>;
export type TeamRegistrationClientValues = z.infer<typeof teamRegistrationClientSchema>;
export type TeamRegistrationServerValues = z.infer<typeof teamRegistrationServerSchema>;
