"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  Crosshair,
  ShieldCheck,
  Swords,
  UploadCloud,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  teamRegistrationClientSchema,
  type TeamRegistrationClientValues,
} from "@/features/registration/schemas";
import type { TeamRegistrationActionResult } from "@/features/registration/actions";
import { cn } from "@/lib/utils";
import { normalizeRiotId, RIOT_ID_REGEX } from "@/lib/validators/riot-id";

type PlayerRole = "starter" | "substitute";

type RosterSlot = {
  position: number;
  role: PlayerRole;
  label: string;
  helper: string;
};

const ROSTER_SLOTS: readonly RosterSlot[] = [
  { position: 1, role: "starter", label: "Titular 1", helper: "Entry / Duelist" },
  { position: 2, role: "starter", label: "Titular 2", helper: "Controller" },
  { position: 3, role: "starter", label: "Titular 3", helper: "Initiator" },
  { position: 4, role: "starter", label: "Titular 4", helper: "Sentinel" },
  { position: 5, role: "starter", label: "Titular 5", helper: "Flex" },
  { position: 6, role: "substitute", label: "Suplente", helper: "Backup" },
];

function createDefaultValues(tournamentSlug: string): TeamRegistrationClientValues {
  return {
    tournamentSlug,
    teamName: "",
    players: ROSTER_SLOTS.map((slot) => ({
      position: slot.position,
      role: slot.role,
      riotId: "",
    })),
  };
}

type TeamRegistrationStepOneProps = {
  tournamentName?: string;
  tournamentSlug?: string;
  className?: string;
  submitAction: (formData: FormData) => Promise<TeamRegistrationActionResult>;
};

export function TeamRegistrationStepOne({
  tournamentName = "Valorant Ignition Cup",
  tournamentSlug = "valorant-ignition-cup",
  className,
  submitAction,
}: TeamRegistrationStepOneProps) {
  const router = useRouter();
  const logoInputId = React.useId();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<TeamRegistrationClientValues>({
    resolver: zodResolver(teamRegistrationClientSchema),
    mode: "onChange",
    criteriaMode: "all",
    defaultValues: createDefaultValues(tournamentSlug),
  });

  const watchedValues = useWatch({ control: form.control });
  const logoFile = form.watch("logo")?.item(0) ?? null;

  const completion = React.useMemo(() => {
    const requiredFields = 1 + ROSTER_SLOTS.length;
    const hasTeamName = (watchedValues.teamName?.trim().length ?? 0) >= 3 ? 1 : 0;
    const validPlayers =
      watchedValues.players?.filter((player) =>
        RIOT_ID_REGEX.test(normalizeRiotId(player?.riotId ?? "")),
      ).length ?? 0;

    return Math.round(((hasTeamName + validPlayers) / requiredFields) * 100);
  }, [watchedValues.players, watchedValues.teamName]);

  const handleValidSubmit = React.useCallback(
    (values: TeamRegistrationClientValues) => {
      const formData = new FormData();
      const logo = values.logo?.item(0) ?? null;

      formData.set("tournamentSlug", values.tournamentSlug);
      formData.set("teamName", values.teamName);
      formData.set("players", JSON.stringify(values.players));

      if (logo) {
        formData.set("logo", logo);
      }

      startTransition(async () => {
        const result = await submitAction(formData);

        if (result.status === "success") {
          toast.success(result.message);
          router.push("/dashboard");
          return;
        }

        toast.error(result.message);
      });
    },
    [router, submitAction],
  );

  const {
    formState: { errors, isSubmitting, isValid },
    register,
  } = form;

  const isBusy = isSubmitting || isPending;
  const playerErrors = Array.isArray(errors.players) ? errors.players : undefined;
  const playersGroupError = Array.isArray(errors.players)
    ? undefined
    : errors.players?.message;

  return (
    <motion.section
      initial={{ opacity: 0, y: 28, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative mx-auto w-full max-w-5xl", className)}
    >
      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[2rem] bg-valorant-red/20 blur-3xl" />

      <Card className="clip-valorant relative overflow-hidden border-valorant-red/25 bg-valorant-dark/95 text-valorant-white shadow-valorant-glow">
        <div aria-hidden="true" className="valorant-grid pointer-events-none absolute inset-0 animate-grid-pulse opacity-30" />
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden bg-valorant-red/30">
          <div className="h-full w-1/2 animate-red-scan bg-gradient-to-r from-transparent via-valorant-red to-transparent" />
        </div>

        <CardHeader className="relative z-10 border-b border-valorant-red/15 bg-black/20 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit border border-valorant-red/30 bg-valorant-red/10 text-valorant-red hover:bg-valorant-red/10">
                <Crosshair className="mr-1 size-3.5" />
                Registro competitivo
              </Badge>

              <div>
                <CardTitle className="text-balance text-3xl font-black uppercase tracking-[0.12em] md:text-5xl">
                  Lock in your <span className="text-valorant-red">squad</span>
                </CardTitle>
                <CardDescription className="mt-3 max-w-2xl text-base text-zinc-300">
                  Paso 1 · Identidad del equipo y roster inicial para{" "}
                  <span className="font-semibold text-white">{tournamentName}</span>.
                </CardDescription>
              </div>
            </div>

            <div className="min-w-44 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-400">
                <span>Progreso</span>
                <span className="text-valorant-red">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2 bg-zinc-800 [&>div]:bg-valorant-red" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-6 md:p-8">
          <form noValidate className="space-y-8" onSubmit={form.handleSubmit(handleValidSubmit)}>
            <input type="hidden" {...register("tournamentSlug")} />

            <section className="grid gap-5 md:grid-cols-[1fr_18rem]">
              <div className="space-y-2">
                <Label htmlFor="teamName" className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-300">
                  Nombre del equipo
                </Label>

                <div className="relative">
                  <Input
                    id="teamName"
                    placeholder="Ej: Neon Reapers"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.teamName)}
                    className="h-14 border-white/10 bg-black/40 pr-12 text-lg font-bold uppercase tracking-wide text-white placeholder:text-zinc-600 focus-visible:border-valorant-red focus-visible:ring-valorant-red/40"
                    {...register("teamName")}
                  />
                  <Swords className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-valorant-red" />
                </div>

                {errors.teamName?.message ? (
                  <p className="text-sm text-valorant-red">{errors.teamName.message}</p>
                ) : (
                  <p className="text-sm text-zinc-500">Se usará para slug, bracket y tarjeta pública del equipo.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={logoInputId} className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-300">
                  Logo
                </Label>

                <label
                  htmlFor={logoInputId}
                  className={cn(
                    "group flex h-14 cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-white/15 bg-black/40 px-4 transition",
                    "hover:border-valorant-red/60 hover:bg-valorant-red/5",
                    errors.logo && "border-valorant-red/70",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-md bg-valorant-red/10 text-valorant-red transition group-hover:bg-valorant-red group-hover:text-white">
                      <UploadCloud className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">
                        {logoFile ? logoFile.name : "Subir imagen"}
                      </span>
                      <span className="block text-xs text-zinc-500">PNG, JPG, WEBP, SVG · 2 MB</span>
                    </span>
                  </span>
                </label>

                <Input
                  id={logoInputId}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  aria-invalid={Boolean(errors.logo)}
                  {...register("logo")}
                />

                {errors.logo?.message ? <p className="text-sm text-valorant-red">{String(errors.logo.message)}</p> : null}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-valorant-red" />
                    <h3 className="text-xl font-black uppercase tracking-[0.16em]">Roster</h3>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">Registra 5 titulares + 1 suplente. No se permiten Riot IDs duplicados.</p>
                </div>

                <Badge variant="outline" className="w-fit border-valorant-orange/40 bg-valorant-orange/10 text-valorant-orange">
                  <Zap className="mr-1 size-3.5" />
                  Formato: Player#LAN
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {ROSTER_SLOTS.map((slot, index) => {
                  const fieldError = playerErrors?.[index]?.riotId?.message;
                  const isSubstitute = slot.role === "substitute";

                  return (
                    <motion.div
                      key={slot.position}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * index, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "relative overflow-hidden rounded-xl border bg-black/35 p-4",
                        fieldError ? "border-valorant-red/70" : "border-white/10",
                        isSubstitute && "border-valorant-orange/30",
                      )}
                    >
                      <input type="hidden" {...register(`players.${index}.position`, { valueAsNumber: true })} />
                      <input type="hidden" {...register(`players.${index}.role`)} />

                      <div aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", isSubstitute ? "bg-valorant-orange" : "bg-valorant-red")} />

                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <Label htmlFor={`players.${index}.riotId`} className="font-black uppercase tracking-[0.14em] text-white">
                            {slot.label}
                          </Label>
                          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{slot.helper}</p>
                        </div>

                        <ShieldCheck className={cn("size-5", isSubstitute ? "text-valorant-orange" : "text-valorant-red")} />
                      </div>

                      <Input
                        id={`players.${index}.riotId`}
                        placeholder={isSubstitute ? "Backup#LAN" : `Player${index + 1}#LAN`}
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={Boolean(fieldError)}
                        className="h-12 border-white/10 bg-valorant-darker/80 font-semibold text-white placeholder:text-zinc-700 focus-visible:border-valorant-red focus-visible:ring-valorant-red/40"
                        {...register(`players.${index}.riotId`)}
                      />

                      {fieldError ? <p className="mt-2 text-sm text-valorant-red">{fieldError}</p> : null}
                    </motion.div>
                  );
                })}
              </div>

              {typeof playersGroupError === "string" ? (
                <p className="text-sm text-valorant-red">{playersGroupError}</p>
              ) : null}
            </section>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-zinc-500">
                Al continuar, el roster quedará en estado <span className="font-semibold text-zinc-300">pending_review</span> hasta validación del admin.
              </p>

              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isBusy || !isValid}
                  className="valorant-glow-button h-12 min-w-48 rounded-none px-7 font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBusy ? "Enviando..." : "Continuar"}
                </Button>
              </motion.div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.section>
  );
}
