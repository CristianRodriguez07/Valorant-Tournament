"use client";

import * as React from "react";
import { motion } from "motion/react";

function getTimeLeft(targetDate: Date) {
  const diff = Math.max(targetDate.getTime() - Date.now(), 0);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

type TournamentCountdownProps = {
  targetDate: Date;
};

export function TournamentCountdown({ targetDate }: TournamentCountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState(() => getTimeLeft(targetDate));

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  const entries = [
    ["Días", timeLeft.days],
    ["Horas", timeLeft.hours],
    ["Min", timeLeft.minutes],
    ["Seg", timeLeft.seconds],
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {entries.map(([label, value], index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="rounded-xl border border-valorant-red/25 bg-black/40 p-3 text-center backdrop-blur"
        >
          <div className="font-mono text-2xl font-black text-white sm:text-4xl">
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
            {label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
