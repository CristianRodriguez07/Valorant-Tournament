import { Trophy, Shield, RadioTower } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function PrizePoolCard() {
  return (
    <Card className="valorant-card overflow-hidden rounded-2xl py-0">
      <CardContent className="relative p-6">
        <div aria-hidden="true" className="absolute right-0 top-0 h-28 w-28 bg-valorant-red/20 blur-3xl" />
        <Badge className="mb-4 border border-valorant-orange/30 bg-valorant-orange/10 text-valorant-orange">
          <Trophy className="size-3.5" />
          Prize Pool
        </Badge>

        <div className="text-5xl font-black tracking-tight text-white">$5,000</div>
        <p className="mt-2 text-sm text-zinc-400">Reparto top 3 · skins, cash y slot invitado.</p>

        <div className="mt-6 grid gap-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <span className="flex items-center gap-2 text-zinc-300"><Shield className="size-4 text-valorant-red" />Formato</span>
            <span className="font-bold text-white">Bo3 Playoffs</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <span className="flex items-center gap-2 text-zinc-300"><RadioTower className="size-4 text-valorant-red" />Servidor</span>
            <span className="font-bold text-white">LAN / LATAM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
