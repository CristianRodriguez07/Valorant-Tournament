import { ShieldCheck, UserCheck, Users } from "lucide-react";

import type { TeamMember } from "@/db/schema";
import { getRosterReadiness } from "@/features/matchday/status";

export function SquadIntegrityPanel({ members }: { members: TeamMember[] }) {
  const readiness = getRosterReadiness(members.length);
  const starters = members.filter((member) => member.role === "starter").length;
  const substitutes = members.filter((member) => member.role === "substitute").length;

  return (
    <section className="squad-integrity-panel">
      <div className="concept-kicker flex items-center gap-2">
        <Users className="size-4" />
        Squad integrity
      </div>
      <div className="squad-integrity-score">{readiness.value}</div>
      <p>{readiness.description}</p>
      <div className="squad-integrity-stats">
        <span>
          <UserCheck className="size-4" /> {starters} starters
        </span>
        <span>
          <ShieldCheck className="size-4" /> {substitutes} substitutes
        </span>
      </div>
    </section>
  );
}
