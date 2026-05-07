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
  { position: 1, role: "starter", label: "Titular 1", helper: "Entrada / Duelista" },
  { position: 2, role: "starter", label: "Titular 2", helper: "Controlador" },
  { position: 3, role: "starter", label: "Titular 3", helper: "Iniciador" },
  { position: 4, role: "starter", label: "Titular 4", helper: "Centinela" },
  { position: 5, role: "starter", label: "Titular 5", helper: "Flexible" },
  { position: 6, role: "substitute", label: "Suplente", helper: "Reserva" },
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
  const logoFile = watchedValues.logo?.item(0) ?? null;

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
      className={cn("relative mx-auto w-full max-w-6xl", className)}
    >
      <Card className="arena-panel relative overflow-hidden text-valorant-bone">
        <div aria-hidden="true" className="arena-grid pointer-events-none absolute inset-0 animate-grid-pulse opacity-25" />
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden bg-valorant-red/35">
          <div className="h-full w-1/2 animate-red-scan bg-gradient-to-r from-transparent via-valorant-red to-transparent" />
        </div>

        <CardHeader className="relative z-10 border-b border-valorant-line/60 bg-valorant-ink/40 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <Badge className="arena-panel-soft w-fit rounded-none border-valorant-red/35 bg-valorant-red/10 text-valorant-red hover:bg-valorant-red/10">
                <Crosshair className="mr-1 size-3.5" />
                Protocolo de cierre
              </Badge>

              <div>
                <CardTitle className="arena-display text-balance text-5xl leading-none md:text-7xl">
                  Cierra tu <span className="text-valorant-red">equipo</span>
                </CardTitle>
                <CardDescription className="mt-3 max-w-2xl text-base font-medium leading-7 text-valorant-muted">
                  Paso 1 · Identidad del equipo y plantilla inicial para{" "}
                  <span className="font-semibold text-valorant-bone">{tournamentName}</span>.
                </CardDescription>
              </div>
            </div>

            <div className="arena-panel-soft min-w-52 p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-valorant-muted">
                <span>Progreso</span>
                <span className="text-valorant-red">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2 bg-valorant-ink [&>div]:bg-valorant-red" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-6 md:p-8">
          <form noValidate className="space-y-8" onSubmit={form.handleSubmit(handleValidSubmit)}>
            <input type="hidden" {...register("tournamentSlug")} />

            <section className="grid gap-5 md:grid-cols-[1fr_18rem]">
              <div className="space-y-2">
                <Label htmlFor="teamName" className="arena-kicker text-valorant-muted">
                  Nombre del equipo
                </Label>

                <div className="relative">
                  <Input
                    id="teamName"
                    placeholder="Ej: Segadores Neón"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.teamName)}
                    className="h-14 rounded-none border-valorant-line/60 bg-valorant-ink/80 pr-12 text-lg font-black uppercase tracking-[0.08em] text-valorant-bone placeholder:text-valorant-muted/45 focus-visible:border-valorant-red focus-visible:ring-valorant-red/40"
                    {...register("teamName")}
                  />
                  <Swords className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-valorant-red" />
                </div>

                {errors.teamName?.message ? (
                  <p className="text-sm font-semibold text-valorant-red">{errors.teamName.message}</p>
                ) : (
                  <p className="text-sm text-valorant-muted">Se usará para el identificador, el cuadro y la tarjeta pública del equipo.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={logoInputId} className="arena-kicker text-valorant-muted">
                  Logo
                </Label>

                <label
                  htmlFor={logoInputId}
                  className={cn(
                    "group flex h-14 cursor-pointer items-center justify-between gap-3 border border-dashed border-valorant-line/70 bg-valorant-ink/80 px-4 transition",
                    "hover:border-valorant-red/70 hover:bg-valorant-red/10",
                    errors.logo && "border-valorant-red/70",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 place-items-center bg-valorant-red/10 text-valorant-red transition group-hover:bg-valorant-red group-hover:text-valorant-bone clip-valorant">
                      <UploadCloud className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">
                        {logoFile ? logoFile.name : "Subir imagen"}
                      </span>
                      <span className="block text-xs text-valorant-muted">PNG, JPG, WEBP, SVG · 2 MB</span>
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

                {errors.logo?.message ? <p className="text-sm font-semibold text-valorant-red">{String(errors.logo.message)}</p> : null}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-valorant-red" />
                    <h3 className="arena-display text-4xl leading-none">Plantilla</h3>
                  </div>
                  <p className="mt-1 text-sm text-valorant-muted">Registra 5 titulares + 1 suplente. No se permiten Riot IDs duplicados.</p>
                </div>

                <Badge variant="outline" className="w-fit rounded-none border-valorant-ember/40 bg-valorant-ember/10 text-valorant-ember">
                  <Zap className="mr-1 size-3.5" />
                  Formato: Jugador#LAN
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
                        "arena-panel-soft relative overflow-hidden p-4",
                        fieldError ? "border-valorant-red/70" : "border-white/10",
                        isSubstitute && "border-valorant-ember/40",
                      )}
                    >
                      <input type="hidden" {...register(`players.${index}.position`, { valueAsNumber: true })} />
                      <input type="hidden" {...register(`players.${index}.role`)} />

                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <Label htmlFor={`players.${index}.riotId`} className="font-black uppercase tracking-[0.14em] text-valorant-bone">
                            {slot.label}
                          </Label>
                          <p className="text-xs uppercase tracking-[0.16em] text-valorant-muted">{slot.helper}</p>
                        </div>

                        <ShieldCheck className={cn("size-5", isSubstitute ? "text-valorant-ember" : "text-valorant-red")} />
                      </div>

                      <Input
                        id={`players.${index}.riotId`}
                        placeholder={isSubstitute ? "Reserva#LAN" : `Jugador${index + 1}#LAN`}
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={Boolean(fieldError)}
                        className="h-12 rounded-none border-valorant-line/60 bg-valorant-ink/80 font-semibold text-valorant-bone placeholder:text-valorant-muted/40 focus-visible:border-valorant-red focus-visible:ring-valorant-red/40"
                        {...register(`players.${index}.riotId`)}
                      />

                      {fieldError ? <p className="mt-2 text-sm font-semibold text-valorant-red">{fieldError}</p> : null}
                    </motion.div>
                  );
                })}
              </div>

              {typeof playersGroupError === "string" ? (
                <p className="text-sm font-semibold text-valorant-red">{playersGroupError}</p>
              ) : null}
            </section>

            <div className="flex flex-col gap-3 border-t border-valorant-line/60 pt-6 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-valorant-muted">
                Al continuar, la plantilla quedará en estado <span className="font-semibold text-valorant-bone">pendiente de revisión</span> hasta validación de administración.
              </p>

              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isBusy || !isValid}
                  className="arena-button h-12 min-w-48 rounded-none px-7 font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
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
