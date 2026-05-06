import type { Metadata } from "next";

import { TeamRegistrationStepOne } from "@/components/registration/team-registration-step-one";
import { submitTeamRegistrationStepOne } from "@/features/registration/actions";

export const metadata: Metadata = {
  title: "Registro de equipo",
  description: "Registra tu equipo de Valorant, logo y roster para el torneo.",
};

export default function RegisterPage() {
  return (
    <main className="min-h-svh px-6 py-12 md:px-10">
      <TeamRegistrationStepOne
        tournamentName="Valorant Ignition Cup"
        tournamentSlug="valorant-ignition-cup"
        submitAction={submitTeamRegistrationStepOne}
      />
    </main>
  );
}
