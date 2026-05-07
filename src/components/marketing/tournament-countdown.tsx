"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Lock } from "lucide-react";

function getTimeLeft(targetDate: Date) {
  const diff = Math.max(targetDate.getTime() - Date.now(), 0);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

type TimeLeft = ReturnType<typeof getTimeLeft>;

type TournamentCountdownProps = {
  targetDate: Date;
};

export function TournamentCountdown({ targetDate }: TournamentCountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft | null>(null);

  React.useEffect(() => {
    const updateTimeLeft = () => {
      setTimeLeft(getTimeLeft(targetDate));
    };

    const timeout = window.setTimeout(updateTimeLeft, 0);
    const interval = window.setInterval(updateTimeLeft, 1000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [targetDate]);

  const entries = [
    ["Días", timeLeft?.days],
    ["Horas", timeLeft?.hours],
    ["Min", timeLeft?.minutes],
    ["Seg", timeLeft?.seconds],
  ] as const;

  return (
    <div className="arena-panel-soft p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="arena-kicker flex items-center gap-2">
          <Lock className="size-4" />
          Tournament starts in
        </div>
        <span className="animate-lock-blink text-[0.68rem] font-black uppercase tracking-[0.2em] text-valorant-green">
          Live scan
        </span>
      </div>

      <div className="grid grid-cols-4 divide-x divide-valorant-line/60">
        {entries.map(([label, value], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
            className="px-2 text-center first:pl-0 last:pr-0"
          >
            <div className="arena-display text-4xl leading-none text-valorant-red sm:text-6xl">
              {value === undefined ? "--" : String(value).padStart(2, "0")}
            </div>
            <div className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.2em] text-valorant-muted sm:text-xs">
              {label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
