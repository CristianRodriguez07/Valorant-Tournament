import { Badge } from "@/components/ui/badge";
import type { TeamMember } from "@/db/schema";

const roleLabels = {
  starter: "Titular",
  substitute: "Suplente",
} as const satisfies Record<TeamMember["role"], string>;

export function RosterTable({ members }: { members: TeamMember[] }) {
  const sortedMembers = [...members].sort((a, b) => a.position - b.position);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {sortedMembers.map((member) => (
        <article key={member.id} className="arena-panel-soft p-4">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="arena-display text-5xl leading-none text-valorant-bone">
              {String(member.position).padStart(2, "0")}
            </div>
            <Badge
              className={
                member.role === "starter"
                  ? "rounded-none bg-valorant-red text-valorant-bone"
                  : "rounded-none bg-valorant-ember text-valorant-ink"
              }
            >
              {roleLabels[member.role]}
            </Badge>
          </div>

          <div className="text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">Riot ID</div>
          <div className="arena-display mt-2 break-words text-4xl leading-none text-valorant-bone">{member.riotId}</div>

          <div className="mt-5 h-2 overflow-hidden bg-valorant-ink">
            <div className={member.role === "starter" ? "h-full w-full bg-valorant-red" : "h-full w-2/3 bg-valorant-ember"} />
          </div>
        </article>
      ))}
    </div>
  );
}
