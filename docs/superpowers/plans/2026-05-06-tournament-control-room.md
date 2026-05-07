# Plan de Implementacion de la Sala de Control del Torneo

> **Para agentes de implementacion:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans` para ejecutar este plan por tareas. Las rutas, nombres de archivos, comandos y valores de base de datos se mantienen en su forma tecnica para evitar ambiguedad.

## Objetivo

Construir la primera version de la sala de control del torneo: actividad de mision para capitanes, sala lista de jornada, estado de plantilla y una ruta de administracion protegida usando el esquema de base de datos existente.

## Arquitectura

La app se mantiene primero en servidor. Los modulos de funcionalidad derivan el estado del torneo desde tablas Drizzle; las paginas cargan datos y los pasan a componentes visuales enfocados. La primera pasada evita migraciones y reserva reporte/disputa como acciones deshabilitadas hasta una fase posterior de esquema.

## Pila Tecnica

- Next.js App Router y React Server Components
- Server Actions
- Auth.js
- Drizzle ORM
- Tailwind CSS v4
- lucide-react
- Primitivas locales estilo shadcn

## Estructura de Archivos

- `src/features/matchday/status.ts`: ayudantes puros para registro, plantilla, presencia y estados de accion.
- `src/features/matchday/actions.ts`: accion de servidor para confirmar presencia del capitan, con validacion de sesion y propiedad.
- `src/features/tournaments/queries.ts`: consultas de mision de capitan y cola de administracion.
- `src/features/brackets/queries.ts`: consulta de siguiente partida y plantilla existente.
- `src/components/dashboard/mission-feed.tsx`: bloques de estado para capitan.
- `src/components/dashboard/ready-room-panel.tsx`: UI de siguiente partida, cuadro pendiente y presencia.
- `src/components/dashboard/squad-integrity-panel.tsx`: completitud de plantilla y estado de plazas.
- `src/components/dashboard/match-action-panel.tsx`: acciones reservadas para resultado y disputa.
- `src/components/dashboard/admin-signal-card.tsx`: senal de revision y estado de administracion.
- `src/app/(dashboard)/dashboard/page.tsx`: composicion de mision, sala lista y plantilla.
- `src/app/(dashboard)/dashboard/brackets/page.tsx`: sala lista con lista de partidas.
- `src/app/(dashboard)/dashboard/roster/page.tsx`: revision y estado de plantilla.
- `src/app/(dashboard)/dashboard/admin/page.tsx`: sala de control solo para administracion.
- `src/app/(dashboard)/layout.tsx`: navegacion con enlace de administracion condicionado por rol.
- `src/app/globals.css`: clases visuales de la sala de control reutilizando tokens VALORANT.

## Tareas

### 1. Estados de Jornada

- Crear ayudantes puros para:
  - Lectura de preparacion de plantilla.
  - Estado de registro.
  - Estado de siguiente partida.
  - Accion de presencia.
  - Formateo de fecha en `es-ES`.
- Verificar con:

```powershell
pnpm typecheck
```

### 2. Consultas y Accion de Presencia

- Ampliar `src/features/tournaments/queries.ts` con:
  - Mision activa del capitan.
  - Cola de registros para administracion.
- Ampliar `src/features/brackets/queries.ts` con:
  - Siguiente partida del equipo.
- Crear `src/features/matchday/actions.ts` con:
  - Validacion de sesion.
  - Validacion de propiedad del equipo.
  - Rechazo cuando la inscripcion no esta aprobada.
  - Revalidacion de `/dashboard`, `/dashboard/brackets` y `/dashboard/roster`.
- Verificar con:

```powershell
pnpm typecheck
```

### 3. Componentes de Panel

- Crear `MissionFeed` para cuatro celdas tacticas.
- Crear `ReadyRoomPanel` para la sala lista y la accion de presencia.
- Crear `SquadIntegrityPanel` para composicion de plantilla.
- Crear `MatchActionPanel` con resultado y disputa reservados.
- Crear `AdminSignalCard` para lectura de estado por administracion.
- Verificar con:

```powershell
pnpm typecheck
```

### 4. Integracion de Rutas de Capitan

- En `/dashboard`, cargar mision, plantilla y siguiente partida.
- En `/dashboard/brackets`, mostrar sala lista, acciones de partida y lista existente.
- En `/dashboard/roster`, mostrar integridad de plantilla, senal de administracion y tabla de jugadores.
- Mantener estados vacios con accion clara hacia `/register`.
- Verificar con:

```powershell
pnpm typecheck
```

### 5. Sala de Administracion

- Crear `/dashboard/admin` protegida por `session.user.role === "admin"`.
- Mostrar escaneo de cola con torneo, equipo, estado, plazas y presencia.
- Anadir enlace de navegacion solo para usuarios administradores.
- Verificar con:

```powershell
pnpm typecheck
```

### 6. Estilo Visual y Verificacion

- Anadir utilidades CSS para:
  - Celdas de mision.
  - Sala lista.
  - Integridad de plantilla.
  - Acciones de partida.
  - Cola de administracion.
  - Comportamiento responsive.
- Ejecutar:

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

## Revision Manual

Probar en navegador:

- `/`
- `/sign-in`
- `/dashboard`
- `/dashboard/roster`
- `/dashboard/brackets`
- `/dashboard/admin`

## Criterios de Aceptacion

- El capitan entiende su siguiente accion en menos de cinco segundos.
- La pagina de cuadro es util antes y despues de publicar enfrentamientos.
- La pagina de plantilla explica preparacion, no solo nombres.
- La sala de administracion queda protegida por rol.
- No hay regresiones en autenticacion, registro, panel, plantilla ni cuadro.
- La UI mantiene la identidad tactica VALORANT en escritorio y movil.
