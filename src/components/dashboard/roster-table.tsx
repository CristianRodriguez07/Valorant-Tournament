import { Badge } from "@/components/ui/badge";
import type { TeamMember } from "@/db/schema";

export function RosterTable({ members }: { members: TeamMember[] }) {
  const sortedMembers = [...members].sort((a, b) => a.position - b.position);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-zinc-500">
          <tr>
            <th className="px-4 py-3">Slot</th>
            <th className="px-4 py-3">Riot ID</th>
            <th className="px-4 py-3">Rol</th>
          </tr>
        </thead>
        <tbody>
          {sortedMembers.map((member) => (
            <tr key={member.id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-mono text-zinc-400">#{member.position}</td>
              <td className="px-4 py-3 font-bold text-white">{member.riotId}</td>
              <td className="px-4 py-3">
                <Badge className={member.role === "starter" ? "bg-valorant-red text-white" : "bg-valorant-orange text-black"}>
                  {member.role === "starter" ? "Titular" : "Suplente"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
