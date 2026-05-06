"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { uploadTeamLogo } from "@/lib/supabase/storage";

import { registerTeam, RegistrationError } from "./services/register-team.service";
import { teamRegistrationServerSchema } from "./schemas";

export type TeamRegistrationActionResult = {
  status: "success" | "error";
  message: string;
};

function readLogo(formData: FormData): File | null {
  const logo = formData.get("logo");

  if (!(logo instanceof File) || logo.size === 0) {
    return null;
  }

  return logo;
}

export async function submitTeamRegistrationStepOne(
  formData: FormData,
): Promise<TeamRegistrationActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  try {
    const playersRaw = formData.get("players");

    const parsed = teamRegistrationServerSchema.parse({
      tournamentSlug: String(formData.get("tournamentSlug") ?? "valorant-ignition-cup"),
      teamName: String(formData.get("teamName") ?? ""),
      players: typeof playersRaw === "string" ? JSON.parse(playersRaw) : [],
      logo: readLogo(formData),
    });

    const logoUrl = parsed.logo
      ? await uploadTeamLogo({
          file: parsed.logo,
          teamName: parsed.teamName,
          userId: session.user.id,
        })
      : null;

    await registerTeam({
      captainId: session.user.id,
      tournamentSlug: parsed.tournamentSlug,
      teamName: parsed.teamName,
      logoUrl,
      players: parsed.players,
    });

    revalidatePath("/dashboard");
    revalidatePath("/register");

    return {
      status: "success",
      message: "Equipo registrado. Tu inscripción está pendiente de revisión.",
    };
  } catch (error) {
    if (error instanceof RegistrationError) {
      return { status: "error", message: error.message };
    }

    if (error instanceof z.ZodError) {
      return {
        status: "error",
        message: error.issues[0]?.message ?? "Datos de registro inválidos.",
      };
    }

    console.error(error);
    return {
      status: "error",
      message: "Ocurrió un error inesperado al registrar el equipo.",
    };
  }
}
