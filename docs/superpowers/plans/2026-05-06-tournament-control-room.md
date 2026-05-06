# Tournament Control Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Tournament Control Room slice: captain mission feed, matchday ready room, roster readiness, and an admin route shell using the existing database schema.

**Architecture:** Keep the app server-first. Feature modules derive tournament state from existing Drizzle tables; route pages load data and pass it into focused presentational dashboard components. The first pass avoids migrations and reserves report/dispute for disabled UI actions until a later schema slice.

**Tech Stack:** Next.js App Router, React Server Components, Server Actions, Auth.js, Drizzle ORM, Tailwind CSS v4, lucide-react, existing shadcn-style UI primitives.

---

## File Structure

- `src/features/matchday/status.ts`: pure helper functions for registration, roster, check-in, and match-action UI states.
- `src/features/matchday/actions.ts`: server action for captain check-in, with auth and ownership validation.
- `src/features/tournaments/queries.ts`: richer captain mission and admin queue queries.
- `src/features/brackets/queries.ts`: next-match query and existing roster query.
- `src/components/dashboard/mission-feed.tsx`: captain-facing mission status blocks.
- `src/components/dashboard/ready-room-panel.tsx`: next match / pending bracket / check-in action UI.
- `src/components/dashboard/squad-integrity-panel.tsx`: roster completeness and slot readiness UI.
- `src/components/dashboard/match-action-panel.tsx`: report/dispute reserved action UI.
- `src/components/dashboard/admin-signal-card.tsx`: admin review/status signal panel.
- `src/app/(dashboard)/dashboard/page.tsx`: compose mission feed, ready room preview, squad integrity.
- `src/app/(dashboard)/dashboard/brackets/page.tsx`: convert bracket page into ready room.
- `src/app/(dashboard)/dashboard/roster/page.tsx`: add roster review/readiness context.
- `src/app/(dashboard)/dashboard/admin/page.tsx`: admin-only control room shell.
- `src/app/(dashboard)/layout.tsx`: add Admin nav item conditionally for admin users.
- `src/app/globals.css`: add Control Room-specific classes while reusing current Valorant tokens.

## Task 1: Matchday State Helpers

**Files:**
- Create: `src/features/matchday/status.ts`
- Test: `pnpm typecheck`

- [ ] **Step 1: Create pure status helpers**

Add the following file:

```ts
import type { Match, Team, TournamentRegistration } from "@/db/schema";

export type MissionTone = "danger" | "warning" | "ready" | "neutral";

export type ReadyRoomMatch = Match & {
  teamA?: Team | null;
  teamB?: Team | null;
};

export type MissionItem = {
  id: string;
  label: string;
  value: string;
  description: string;
  tone: MissionTone;
};

export function getRosterReadiness(memberCount: number) {
  if (memberCount >= 6) {
    return {
      label: "Roster locked",
      value: `${memberCount} / 6`,
      description: "Six Riot IDs are ready for admin review.",
      tone: "ready" as const,
    };
  }

  return {
    label: "Roster incomplete",
    value: `${memberCount} / 6`,
    description: `${6 - memberCount} player slot${6 - memberCount === 1 ? "" : "s"} must be filled before the squad can lock.`,
    tone: "danger" as const,
  };
}

export function getRegistrationMission(status: TournamentRegistration["status"]) {
  const states = {
    draft: ["Draft", "Finish the squad registration before entering review.", "warning"],
    pending_review: ["Under review", "Admin is validating the squad and Riot IDs.", "warning"],
    approved: ["Approved", "Your squad is eligible for matchday operations.", "ready"],
    rejected: ["Rejected", "Registration needs a correction before entering the bracket.", "danger"],
    waitlisted: ["Waitlisted", "The squad is queued behind the current tournament cap.", "warning"],
    checked_in: ["Checked in", "Captain presence is confirmed for matchday.", "ready"],
  } satisfies Record<TournamentRegistration["status"], [string, string, MissionTone]>;

  const [value, description, tone] = states[status];

  return {
    label: "Registration",
    value,
    description,
    tone,
  };
}

export function getMatchMission(match: ReadyRoomMatch | null | undefined) {
  if (!match) {
    return {
      label: "Next match",
      value: "Bracket pending",
      description: "Opponent and lobby details appear after admin publishes the bracket.",
      tone: "neutral" as const,
    };
  }

  return {
    label: `Round ${match.round} / Match ${match.matchNumber}`,
    value: `${match.teamA?.name ?? "Awaiting assignment"} vs ${match.teamB?.name ?? "Awaiting assignment"}`,
    description: match.scheduledAt ? `Scheduled for ${formatMatchDate(match.scheduledAt)}` : "Schedule is being finalized.",
    tone: match.status === "ready" || match.status === "live" ? "ready" as const : "warning" as const,
  };
}

export function buildMissionItems(input: {
  registrationStatus: TournamentRegistration["status"];
  memberCount: number;
  checkedInAt?: Date | null;
  nextMatch?: ReadyRoomMatch | null;
}): MissionItem[] {
  const registration = getRegistrationMission(input.registrationStatus);
  const roster = getRosterReadiness(input.memberCount);
  const match = getMatchMission(input.nextMatch);

  return [
    { id: "registration", ...registration },
    { id: "roster", ...roster },
    {
      id: "check-in",
      label: "Check-in",
      value: input.checkedInAt ? "Confirmed" : "Pending",
      description: input.checkedInAt ? `Confirmed at ${formatMatchDate(input.checkedInAt)}` : "Captain check-in opens once the squad is approved.",
      tone: input.checkedInAt ? "ready" : "warning",
    },
    { id: "match", ...match },
  ];
}

export function getReadyRoomActionState(input: {
  registrationStatus: TournamentRegistration["status"];
  checkedInAt?: Date | null;
  nextMatch?: ReadyRoomMatch | null;
}) {
  if (input.checkedInAt) {
    return {
      canCheckIn: false,
      label: "Captain checked in",
      description: "Your team is marked present for tournament operations.",
    };
  }

  if (input.registrationStatus !== "approved") {
    return {
      canCheckIn: false,
      label: "Awaiting approval",
      description: "Check-in unlocks after admin approves the registration.",
    };
  }

  return {
    canCheckIn: true,
    label: input.nextMatch ? "Ready to check in" : "Pre-check available",
    description: input.nextMatch ? "Confirm captain presence before lobby assignment." : "Confirm presence while admin prepares the bracket.",
  };
}

export function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
```

- [ ] **Step 2: Run typecheck and expect any import-only failures to surface**

Run:

```bash
pnpm typecheck
```

Expected: either `PASS`, or only failures caused by later components not existing yet. There should be no syntax errors in `src/features/matchday/status.ts`.

## Task 2: Data Queries And Check-In Action

**Files:**
- Modify: `src/features/tournaments/queries.ts`
- Modify: `src/features/brackets/queries.ts`
- Create: `src/features/matchday/actions.ts`
- Test: `pnpm typecheck`

- [ ] **Step 1: Extend tournament queries**

Update `src/features/tournaments/queries.ts` so it imports `asc`, `count`, and `tournaments`, then add:

```ts
export async function getCaptainMission(userId: string) {
  const [registration] = await db
    .select({
      registrationId: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      checkedInAt: tournamentRegistrations.checkedInAt,
      rejectionReason: tournamentRegistrations.rejectionReason,
      teamId: teams.id,
      teamName: teams.name,
      logoUrl: teams.logoUrl,
      createdAt: tournamentRegistrations.createdAt,
      tournamentId: tournaments.id,
      tournamentTitle: tournaments.title,
      tournamentStatus: tournaments.status,
      tournamentStartsAt: tournaments.startsAt,
      registrationClosesAt: tournaments.registrationClosesAt,
      maxTeams: tournaments.maxTeams,
    })
    .from(tournamentRegistrations)
    .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .where(eq(teams.captainId, userId))
    .orderBy(desc(tournamentRegistrations.createdAt))
    .limit(1);

  return registration ?? null;
}

export async function getAdminRegistrationQueue() {
  return db
    .select({
      registrationId: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      checkedInAt: tournamentRegistrations.checkedInAt,
      teamId: teams.id,
      teamName: teams.name,
      tournamentTitle: tournaments.title,
      memberCount: count(teamMembers.id),
      createdAt: tournamentRegistrations.createdAt,
    })
    .from(tournamentRegistrations)
    .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .groupBy(
      tournamentRegistrations.id,
      tournamentRegistrations.status,
      tournamentRegistrations.checkedInAt,
      teams.id,
      teams.name,
      tournaments.title,
      tournamentRegistrations.createdAt,
    )
    .orderBy(asc(tournamentRegistrations.createdAt));
}
```

Keep the existing `getDashboardRegistrations()` export unchanged for routes that still use it.

- [ ] **Step 2: Extend bracket queries**

Add this function to `src/features/brackets/queries.ts`:

```ts
export async function getNextMatchForTeam(teamId: string) {
  const [match] = await db.query.matches.findMany({
    where: or(eq(matches.teamAId, teamId), eq(matches.teamBId, teamId)),
    orderBy: asc(matches.scheduledAt),
    with: {
      teamA: true,
      teamB: true,
    },
    limit: 1,
  });

  return match ?? null;
}
```

- [ ] **Step 3: Add captain check-in server action**

Create `src/features/matchday/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { teams, tournamentRegistrations } from "@/db/schema";

export type CheckInResult =
  | { ok: true; checkedInAt: Date }
  | { ok: false; error: string };

export async function checkInCaptainTeam(registrationId: string): Promise<CheckInResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Necesitas iniciar sesion para hacer check-in." };
  }

  const [registration] = await db
    .select({
      id: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      checkedInAt: tournamentRegistrations.checkedInAt,
    })
    .from(tournamentRegistrations)
    .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .where(
      and(
        eq(tournamentRegistrations.id, registrationId),
        eq(teams.captainId, session.user.id),
      ),
    )
    .limit(1);

  if (!registration) {
    return { ok: false, error: "No tienes permiso para hacer check-in con este equipo." };
  }

  if (registration.checkedInAt) {
    return { ok: true, checkedInAt: registration.checkedInAt };
  }

  if (registration.status !== "approved") {
    return { ok: false, error: "El check-in se habilita cuando administracion aprueba el roster." };
  }

  const checkedInAt = new Date();

  await db
    .update(tournamentRegistrations)
    .set({
      status: "checked_in",
      checkedInAt,
      updatedAt: checkedInAt,
    })
    .where(eq(tournamentRegistrations.id, registrationId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/brackets");
  revalidatePath("/dashboard/roster");

  return { ok: true, checkedInAt };
}
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: `PASS`, or failures only from UI components not created yet if route edits have already started.

## Task 3: Dashboard Components

**Files:**
- Create: `src/components/dashboard/mission-feed.tsx`
- Create: `src/components/dashboard/ready-room-panel.tsx`
- Create: `src/components/dashboard/squad-integrity-panel.tsx`
- Create: `src/components/dashboard/match-action-panel.tsx`
- Create: `src/components/dashboard/admin-signal-card.tsx`
- Test: `pnpm typecheck`

- [ ] **Step 1: Create `mission-feed.tsx`**

The component receives `MissionItem[]`, renders four tactical cells, and maps tones to Valorant classes:

```tsx
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
```

- [ ] **Step 2: Create `ready-room-panel.tsx`**

The component uses `checkInCaptainTeam` through a form action and disables check-in when the helper says it is locked.

```tsx
import Link from "next/link";
import { CalendarClock, Crosshair, RadioTower, ShieldCheck, Swords } from "lucide-react";

import { Button } from "@/components/ui/button";
import { checkInCaptainTeam } from "@/features/matchday/actions";
import { formatMatchDate, getReadyRoomActionState, type ReadyRoomMatch } from "@/features/matchday/status";

type ReadyRoomPanelProps = {
  registrationId: string;
  registrationStatus: Parameters<typeof getReadyRoomActionState>[0]["registrationStatus"];
  checkedInAt?: Date | null;
  match?: ReadyRoomMatch | null;
};

export function ReadyRoomPanel({ registrationId, registrationStatus, checkedInAt, match }: ReadyRoomPanelProps) {
  const actionState = getReadyRoomActionState({ registrationStatus, checkedInAt, nextMatch: match });

  return (
    <section className="ready-room-panel">
      <div className="ready-room-copy">
        <div className="concept-kicker flex items-center gap-2">
          <RadioTower className="size-4" />
          Matchday ready room
        </div>
        <h2>{match ? "Lobby protocol" : "Bracket signal pending"}</h2>
        <p>{actionState.description}</p>
      </div>

      <div className="ready-room-versus">
        <div>
          <span>Alpha</span>
          <strong>{match?.teamA?.name ?? "Awaiting assignment"}</strong>
        </div>
        <Swords className="size-7 text-valorant-red" />
        <div>
          <span>Omega</span>
          <strong>{match?.teamB?.name ?? "Awaiting assignment"}</strong>
        </div>
      </div>

      <div className="ready-room-actions">
        <div className="ready-room-time">
          <CalendarClock className="size-4" />
          {match?.scheduledAt ? formatMatchDate(match.scheduledAt) : "Schedule awaiting admin publish"}
        </div>

        <form
          action={async () => {
            "use server";
            await checkInCaptainTeam(registrationId);
          }}
        >
          <Button
            disabled={!actionState.canCheckIn}
            className="arena-button h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]"
          >
            {checkedInAt ? <ShieldCheck className="size-4" /> : <Crosshair className="size-4" />}
            {actionState.label}
          </Button>
        </form>

        <Button asChild variant="outline" className="arena-button-outline h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]">
          <Link href="/dashboard/brackets">Open match feed</Link>
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create the remaining dashboard cards**

Create:

```tsx
// src/components/dashboard/squad-integrity-panel.tsx
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
        <span><UserCheck className="size-4" /> {starters} starters</span>
        <span><ShieldCheck className="size-4" /> {substitutes} substitutes</span>
      </div>
    </section>
  );
}
```

```tsx
// src/components/dashboard/match-action-panel.tsx
import { FileWarning, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MatchActionPanel() {
  return (
    <section className="match-action-panel">
      <div>
        <div className="concept-kicker">Result operations</div>
        <h3>Report channel reserved</h3>
        <p>Score reports, proof upload, and dispute handling are staged for the next schema slice.</p>
      </div>
      <div className="match-action-buttons">
        <Button disabled variant="outline" className="arena-button-outline h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]">
          <UploadCloud className="size-4" />
          Report result
        </Button>
        <Button disabled variant="outline" className="arena-button-outline h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]">
          <FileWarning className="size-4" />
          Open dispute
        </Button>
      </div>
    </section>
  );
}
```

```tsx
// src/components/dashboard/admin-signal-card.tsx
import { RadioTower } from "lucide-react";

export function AdminSignalCard({ status }: { status: string }) {
  return (
    <section className="admin-signal-card">
      <div className="concept-kicker flex items-center gap-2">
        <RadioTower className="size-4" />
        Admin signal
      </div>
      <strong>{status}</strong>
      <p>Operations staff can see this squad in the control room queue.</p>
    </section>
  );
}
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: `PASS`.

## Task 4: Wire Captain Dashboard, Ready Room, And Roster

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/brackets/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/roster/page.tsx`
- Test: `pnpm typecheck`

- [ ] **Step 1: Update `/dashboard` composition**

Replace separate dashboard query calls with `getCaptainMission()`, `getRosterForTeam()`, `getNextMatchForTeam()`, and `buildMissionItems()`. The page should render:

```tsx
<MissionFeed items={missionItems} />
<ReadyRoomPanel
  registrationId={mission.registrationId}
  registrationStatus={mission.status}
  checkedInAt={mission.checkedInAt}
  match={nextMatch}
/>
<SquadIntegrityPanel members={members} />
<AdminSignalCard status={formatRegistrationStatus(mission.status)} />
```

Keep the current no-registration empty state and its `/register` CTA.

- [ ] **Step 2: Update `/dashboard/brackets`**

The page should load the captain mission, roster, and next match. If a registration exists, render:

```tsx
<ReadyRoomPanel
  registrationId={registration.registrationId}
  registrationStatus={registration.status}
  checkedInAt={registration.checkedInAt}
  match={nextMatch}
/>
<MatchActionPanel />
```

Below that, keep existing match cards from `getUpcomingMatchesForTeam()` so the ready room does not remove the useful feed.

- [ ] **Step 3: Update `/dashboard/roster`**

Add the squad integrity panel above the existing `RosterTable`:

```tsx
<SquadIntegrityPanel members={team.members} />
<AdminSignalCard status={formatRegistrationStatus(registration.status)} />
<RosterTable members={team.members} />
```

Keep existing fallback states for no roster and no registration.

- [ ] **Step 4: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: `PASS`.

## Task 5: Admin Control Room Shell

**Files:**
- Create: `src/app/(dashboard)/dashboard/admin/page.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`
- Test: `pnpm typecheck`

- [ ] **Step 1: Create admin-only page**

Add `src/app/(dashboard)/dashboard/admin/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { auth } from "@/auth";
import { formatRegistrationStatus } from "@/features/registration/status";
import { getAdminRegistrationQueue } from "@/features/tournaments/queries";

export default async function AdminControlRoomPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const queue = await getAdminRegistrationQueue();

  return (
    <div className="admin-control-room">
      <section className="arena-panel p-6 md:p-8">
        <div className="arena-kicker flex items-center gap-2">
          <ShieldAlert className="size-4" />
          Admin control room
        </div>
        <h1 className="arena-display mt-3 text-7xl leading-none text-valorant-bone md:text-9xl">
          Queue scan
        </h1>
      </section>

      <section className="admin-queue-grid">
        {queue.map((item) => (
          <article key={item.registrationId} className="admin-queue-card">
            <div>
              <span>{item.tournamentTitle}</span>
              <h2>{item.teamName}</h2>
            </div>
            <strong>{formatRegistrationStatus(item.status)}</strong>
            <p>{item.memberCount} / 6 players locked</p>
            <small>{item.checkedInAt ? "Checked in" : "Check-in pending"}</small>
          </article>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Add conditional nav item**

In `src/app/(dashboard)/layout.tsx`, import `ShieldAlert`, move admin nav creation inside the component after session resolution, and append Admin only for `session.user.role === "admin"`:

```tsx
const visibleNavItems = session.user.role === "admin"
  ? [...navItems, ["Admin", "/dashboard/admin", ShieldAlert] as const]
  : navItems;
```

Map `visibleNavItems` instead of `navItems`.

- [ ] **Step 3: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: `PASS`.

## Task 6: Visual CSS And Verification

**Files:**
- Modify: `src/app/globals.css`
- Test: `pnpm lint`, `pnpm typecheck`, `pnpm build`, browser sanity pass

- [ ] **Step 1: Add Control Room classes**

Append focused classes inside `@layer utilities` near the existing `.dash-*` classes:

```css
.mission-feed-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: color-mix(in oklch, var(--valorant-red) 32%, transparent); }
.mission-cell { min-height: 12rem; background: color-mix(in oklch, black 72%, transparent); padding: 1.2rem; }
.mission-cell-head { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: var(--valorant-muted); }
.mission-cell strong { display: block; margin-top: 1.2rem; font-family: var(--font-display); font-size: 3rem; line-height: 0.92; text-transform: uppercase; color: var(--valorant-bone); }
.mission-cell p { margin-top: 0.85rem; color: var(--valorant-muted); font-weight: 600; line-height: 1.55; }
.mission-cell-danger strong, .mission-cell-warning strong { color: var(--valorant-red); }
.mission-cell-ready strong { color: var(--valorant-green); }

.ready-room-panel { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(22rem, 1.1fr) minmax(18rem, 0.8fr); gap: 1px; border: 1px solid color-mix(in oklch, var(--valorant-bone) 18%, transparent); background: color-mix(in oklch, var(--valorant-red) 32%, transparent); }
.ready-room-copy, .ready-room-versus, .ready-room-actions { background: color-mix(in oklch, black 70%, transparent); padding: 1.35rem; }
.ready-room-copy h2 { margin-top: 1rem; font-family: var(--font-display); font-size: 4rem; line-height: 0.85; text-transform: uppercase; color: var(--valorant-bone); }
.ready-room-copy p, .ready-room-time { color: var(--valorant-muted); font-weight: 700; line-height: 1.55; }
.ready-room-versus { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; text-align: center; }
.ready-room-versus span { font-size: 0.72rem; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: var(--valorant-red); }
.ready-room-versus strong { display: block; margin-top: 0.6rem; font-family: var(--font-display); font-size: 3rem; line-height: 0.9; text-transform: uppercase; color: var(--valorant-bone); }
.ready-room-actions { display: grid; align-content: center; gap: 0.8rem; }
.ready-room-time { display: flex; align-items: center; gap: 0.55rem; }

.squad-integrity-panel, .match-action-panel, .admin-signal-card, .admin-queue-card { border: 1px solid color-mix(in oklch, var(--valorant-bone) 18%, transparent); background: color-mix(in oklch, black 66%, transparent); padding: 1.25rem; }
.squad-integrity-score, .admin-signal-card strong, .match-action-panel h3, .admin-queue-card h2 { display: block; margin-top: 0.9rem; font-family: var(--font-display); font-size: 3.3rem; line-height: 0.9; text-transform: uppercase; color: var(--valorant-bone); }
.squad-integrity-panel p, .match-action-panel p, .admin-signal-card p, .admin-queue-card p, .admin-queue-card small { margin-top: 0.8rem; color: var(--valorant-muted); font-weight: 700; }
.squad-integrity-stats, .match-action-buttons { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
.squad-integrity-stats span { display: inline-flex; align-items: center; gap: 0.45rem; color: var(--valorant-green); font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; }
.admin-queue-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.admin-queue-card span { font-size: 0.75rem; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; color: var(--valorant-red); }
.admin-queue-card strong { color: var(--valorant-green); font-size: 0.8rem; letter-spacing: 0.14em; text-transform: uppercase; }
```

Add responsive overrides in the existing media blocks:

```css
@media (max-width: 80rem) {
  .mission-feed-grid,
  .ready-room-panel,
  .admin-queue-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 48rem) {
  .mission-feed-grid,
  .ready-room-panel,
  .ready-room-versus,
  .admin-queue-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Run static verification**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands complete successfully.

- [ ] **Step 3: Browser sanity pass**

Open in the Codex browser and inspect:

```txt
http://localhost:3000/
http://localhost:3000/sign-in
http://localhost:3000/dashboard
http://localhost:3000/dashboard/roster
http://localhost:3000/dashboard/brackets
```

Expected:

- Logged-out pages still render.
- Logged-in dashboard shows mission feed and ready room without overlap.
- Roster shows squad integrity and existing player cards.
- Brackets shows ready room plus match feed/pending state.
- Mobile-width layout has no overlapping text.

## Self-Review

- Spec coverage: mission feed, ready room, roster vault polish, admin shell, no DB migration, disabled report/dispute, testing, and browser sanity are all mapped to tasks.
- Red-flag scan: no unfinished-plan markers or unspecified broad instructions are present.
- Type consistency: `ReadyRoomMatch`, `MissionItem`, `MissionTone`, `getCaptainMission`, `getNextMatchForTeam`, and `checkInCaptainTeam` are defined before being consumed.
