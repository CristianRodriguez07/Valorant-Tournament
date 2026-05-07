# Plan de Implementacion de la Plataforma Competitiva de Doble Eliminacion

> **Para agentes de implementacion:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans` para ejecutar por tareas. Se conservan rutas, comandos, nombres de archivos y valores tecnicos en su forma original.

## Objetivo

Construir una plataforma de torneo real con cuadro de doble eliminacion: publicacion desde administracion, avance automatico, clasificacion, historial de partidas y vistas de cuadro para capitanes y administracion.

## Arquitectura

Primero se implementa la logica pura del cuadro y sus pruebas. Despues se amplian esquema, acciones de servidor, consultas y UI. El motor del cuadro no importa base de datos para que la matematica competitiva sea facil de probar.

## Alcance

Incluye:

- Generacion de cuadro de doble eliminacion.
- Cabezas de serie desde `tournament_registrations.seed`.
- Conteos no potencia de dos con descansos automaticos.
- Publicacion de cuadro desde administracion.
- Avance automatico de ganador y perdedor.
- Eliminacion tras dos derrotas.
- Gran final con final de reinicio si corresponde.
- Clasificacion y capturas historicas de jugadores.
- Vistas tacticas de cuadro para capitan y administracion.

Queda fuera:

- Formato suizo, liga o fase de grupos.
- Automatizacion de Discord.
- Subida de pruebas.
- Busqueda de equipo.
- API de Riot.
- Sockets en tiempo real.
- Ruta publica dedicada de cuadro.

## Estructura de Archivos

- `src/features/brackets/types.ts`: contratos del cuadro.
- `src/features/brackets/double-elimination.ts`: generacion, cabezas de serie, descansos y plan de partidas.
- `src/features/brackets/double-elimination.test.ts`: pruebas de generacion.
- `src/features/brackets/advancement.ts`: resolucion de avance.
- `src/features/brackets/advancement.test.ts`: pruebas de movimiento de ganador/perdedor.
- `src/db/schema.ts`: metadatos de cuadro, clasificacion y capturas de jugadores.
- `src/features/brackets/actions.ts`: publicacion transaccional.
- `src/features/admin/actions.ts`: flujo de publicar y completar resultados.
- `src/features/brackets/queries.ts`: vistas de cuadro, partida actual e historial.
- `src/features/tournaments/queries.ts`: tablero de cabezas de serie.
- `src/features/profiles/queries.ts`: historial de equipo y jugador.
- `src/components/dashboard/seed-board.tsx`: superficie de publicacion.
- `src/components/dashboard/double-elim-bracket.tsx`: representacion compartida del cuadro.
- `src/components/dashboard/player-history-panel.tsx`: historial y registro del equipo.
- `src/app/(dashboard)/dashboard/admin/page.tsx`: tablero de administracion.
- `src/app/(dashboard)/dashboard/brackets/page.tsx`: ruta de cuadro del capitan.
- `src/app/(dashboard)/dashboard/page.tsx`: registro y ruta competitiva.
- `src/app/globals.css`: estilos de carriles, clasificacion y responsive.

## Tareas

### 1. Contratos y Pruebas del Motor

- Crear tipos compartidos para carriles, plazas, partidas planificadas, clasificacion y capturas.
- Crear pruebas para:
  - Siguiente potencia de dos.
  - Orden de cabezas de serie.
  - Cuatro equipos.
  - Seis equipos con descansos.
  - Dos equipos.
  - Error con menos de dos equipos.
- Ejecutar:

```powershell
pnpm exec tsx src/features/brackets/double-elimination.test.ts
```

### 2. Generador de Doble Eliminacion

- Implementar `nextPowerOfTwo`.
- Implementar `getSeedOrder`.
- Normalizar cabezas de serie y duplicados.
- Crear partidas de cuadro superior, cuadro inferior y gran final.
- Conectar ganadores y perdedores.
- Aplicar descansos automaticos.
- Crear clasificacion inicial y capturas de jugadores.
- Ejecutar:

```powershell
pnpm exec tsx src/features/brackets/double-elimination.test.ts
```

### 3. Avance de Partidas

- Crear ayudante puro para completar partidas.
- Mover ganador a `nextMatchId`.
- Mover perdedor a `loserNextMatchId`.
- Actualizar victorias, derrotas y estados.
- Resolver eliminaciones, subcampeon, campeon y final de reinicio.
- Ejecutar:

```powershell
pnpm exec tsx src/features/brackets/advancement.test.ts
```

### 4. Esquema y Acciones

- Anadir campos de metadatos al modelo `matches`.
- Crear tablas de clasificacion y capturas de jugadores.
- Crear accion para publicar cuadro.
- Bloquear publicacion duplicada.
- Escribir partidas, clasificacion y capturas en una transaccion.
- Ejecutar:

```powershell
pnpm db:generate
pnpm typecheck
```

### 5. Cola de Administracion y Resultados

- Reemplazar la creacion de partida ficticia por publicacion de cuadro.
- Mantener revision de registros, disputa y reinicio.
- Completar resultados reportados con avance automatico.
- Revalidar rutas relevantes.
- Ejecutar:

```powershell
pnpm exec tsx src/features/admin/match-launch.test.ts
pnpm exec tsx src/features/admin/match-review.test.ts
```

### 6. Vista de Cuadro y Cabezas de Serie

- Crear consultas para cuadro completo, tablero de cabezas de serie y partida actual.
- Crear `SeedBoard` para administracion.
- Crear `DoubleElimBracket` reutilizable.
- Integrar tablero y cuadro en `/dashboard/admin`.
- Anadir estilos responsive de carriles.
- Ejecutar:

```powershell
pnpm typecheck
pnpm lint
```

### 7. Ruta de Capitan e Historial

- Crear consultas de historial y clasificacion por equipo.
- Crear `PlayerHistoryPanel`.
- Integrar cuadro e historial en `/dashboard/brackets`.
- Integrar registro competitivo en `/dashboard`.
- Ejecutar:

```powershell
pnpm typecheck
pnpm lint
```

### 8. Verificacion Final

Ejecutar pruebas de dominio:

```powershell
pnpm exec tsx src/features/brackets/double-elimination.test.ts
pnpm exec tsx src/features/brackets/advancement.test.ts
pnpm exec tsx src/features/admin/match-launch.test.ts
pnpm exec tsx src/features/admin/match-review.test.ts
pnpm exec tsx src/features/admin/registration-review.test.ts
pnpm exec tsx src/features/matchday/results.test.ts
```

Ejecutar verificacion estatica:

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

Probar manualmente:

- `/`
- `/sign-in`
- `/dashboard`
- `/dashboard/brackets`
- `/dashboard/admin`

Flujo manual recomendado:

1. Entrar como administracion.
2. Confirmar al menos dos equipos aprobados o con presencia confirmada.
3. Publicar cuadro.
4. Abrir cuadro como capitan y confirmar resaltado del equipo.
5. Reportar resultado.
6. Completar resultado desde administracion.
7. Verificar movimiento de ganador y perdedor.
8. Completar partidas hasta gran final.
9. Verificar final de reinicio si gana el finalista del cuadro inferior.

## Criterios de Aceptacion

- Administracion publica un cuadro desde equipos elegibles.
- El sistema crea cuadro superior, cuadro inferior y gran final.
- Los descansos avanzan equipos sin edicion manual.
- Ganador y perdedor avanzan a las plazas correctas.
- Dos derrotas eliminan a un equipo.
- La gran final marca campeon o crea final de reinicio.
- Capitanes ven partida actual, posicion de cuadro e historial.
- Administracion ve salud del cuadro y clasificacion.
- Los flujos de presencia, reporte, disputa, reinicio y completar siguen funcionando.
- La UI mantiene la identidad tactica VALORANT.
