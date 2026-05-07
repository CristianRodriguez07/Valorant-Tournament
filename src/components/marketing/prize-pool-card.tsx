import { Shield, Trophy, Zap } from "lucide-react";

const rewards = [
  ["Top 1", "$2,800", Trophy],
  ["Top 2", "$1,400", Shield],
  ["MVP", "$800", Zap],
] as const;

export function PrizePoolCard() {
  return (
    <div className="arena-panel p-5">
      <div className="arena-kicker flex items-center gap-2">
        <Trophy className="size-4" />
        Total prize pool
      </div>

      <div className="arena-display mt-5 text-6xl leading-none text-valorant-bone">$5,000</div>
      <p className="mt-3 text-sm font-semibold leading-6 text-valorant-muted">
        Reparto top 3, rewards para MVP y slot invitado para el próximo qualifier.
      </p>

      <div className="mt-6 grid gap-2">
        {rewards.map(([label, value, Icon]) => (
          <div key={label} className="arena-panel-soft flex items-center justify-between gap-4 px-3 py-3">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">
              <Icon className="size-4 text-valorant-red" />
              {label}
            </span>
            <span className="arena-display text-2xl text-valorant-bone">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
