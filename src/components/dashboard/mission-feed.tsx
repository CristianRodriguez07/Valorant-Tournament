import { Activity, CheckCircle2, RadioTower, ShieldAlert } from "lucide-react";

import type { MissionItem, MissionTone } from "@/features/matchday/status";
import { cn } from "@/lib/utils";

const toneClasses: Record<MissionTone, string> = {
  danger: "mission-cell-danger",
  warning: "mission-cell-warning",
  ready: "mission-cell-ready",
  neutral: "mission-cell-neutral",
};

const icons = [ShieldAlert, CheckCircle2, RadioTower, Activity] as const;

export function MissionFeed({ items }: { items: MissionItem[] }) {
  return (
    <section className="mission-feed-grid">
      {items.map((item, index) => {
        const Icon = icons[index] ?? Activity;

        return (
          <article key={item.id} className={cn("mission-cell", toneClasses[item.tone])}>
            <div className="mission-cell-head">
              <span>{item.label}</span>
              <Icon className="size-4" />
            </div>
            <strong>{item.value}</strong>
            <p>{item.description}</p>
          </article>
        );
      })}
    </section>
  );
}
