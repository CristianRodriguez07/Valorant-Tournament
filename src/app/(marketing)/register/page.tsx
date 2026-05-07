import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TeamRegistrationStepOne } from "@/components/registration/team-registration-step-one";
import { submitTeamRegistrationStepOne } from "@/features/registration/actions";
import { isActiveRegistrationStatus } from "@/features/registration/status";
import { getDashboardRegistrations } from "@/features/tournaments/queries";

export const metadata: Metadata = {
  title: "Registro de equipo",
  description: "Registra tu equipo de Valorant, logo y plantilla para el torneo.",
};

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user?.id) {
    const registrations = await getDashboardRegistrations(session.user.id);

    if (registrations.some((registration) => isActiveRegistrationStatus(registration.status))) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="arena-stage min-h-svh px-5 py-8 md:px-8 lg:px-10">
      <Image
        src="/media/ignition-arena-keyart.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover opacity-18"
        aria-hidden="true"
      />
      <div className="arena-grid absolute inset-0 -z-10 opacity-30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-valorant-ink/80 via-valorant-ink to-valorant-ink" />

      <TeamRegistrationStepOne
        tournamentName="Valorant Ignition Cup"
        tournamentSlug="valorant-ignition-cup"
        submitAction={submitTeamRegistrationStepOne}
      />
    </main>
  );
}
