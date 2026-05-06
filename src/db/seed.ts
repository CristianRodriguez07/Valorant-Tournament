import "dotenv/config";

import { db } from "./index";
import { tournaments } from "./schema";

async function main() {
  await db
    .insert(tournaments)
    .values({
      title: "Valorant Ignition Cup",
      slug: "valorant-ignition-cup",
      status: "registration_open",
      startsAt: new Date("2026-06-01T18:00:00+02:00"),
      registrationOpensAt: new Date("2026-04-01T00:00:00+02:00"),
      registrationClosesAt: new Date("2026-05-31T23:59:59+02:00"),
      maxTeams: 16,
      prizePoolAmount: "5000.00",
      prizePoolCurrency: "USD",
      heroVideoUrl: "/media/hero-loop.mp4",
      coverImageUrl: "/og/tournament-card.svg",
    })
    .onConflictDoNothing({ target: tournaments.slug });

  console.log("Seed complete: valorant-ignition-cup");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
