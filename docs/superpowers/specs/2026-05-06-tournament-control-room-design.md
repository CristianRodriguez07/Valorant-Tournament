# Diseno de la Sala de Control del Torneo

## Estado

Direccion aprobada en conversacion de producto el 2026-05-06. Esta especificacion define la primera fase de una experiencia operativa para torneos de VALORANT.

## Problema

La app ya tenia una pagina publica potente, acceso social, registro de equipos, panel de capitan, vista de plantilla y lista de cuadro. El siguiente salto era convertirla en una plataforma real de torneo, no en una cascara estatica de registro.

La investigacion sobre Riot Premier y plataformas como Battlefy, start.gg y Toornament apuntaba a necesidades repetidas: menos ambiguedad de horario, siguientes acciones claras, confianza sobre plantilla, presencia de jornada, reporte de resultados, disputas y operaciones comodas para organizadores.

## Objetivos

- Convertir el panel autenticado en una superficie de control para capitanes.
- Anadir una experiencia de jornada con presencia, rival, horario, instrucciones de sala y acciones de resultado.
- Crear bases de datos y consultas para revision de administracion y futuros controles completos.
- Mantener el lenguaje visual VALORANT: superficies oscuras, paneles angulares, rojo de accion, texto hueso, movimiento de escaneo y metadatos compactos.
- Mejorar estados vacios y pendientes para que cada pagina explique que ocurre despues.

## Fuera de Alcance

- Integracion real con la API de Riot.
- Automatizacion de Discord o creacion de canales.
- Generador completo de cuadro en esta fase.
- Permisos complejos de varios administradores.
- Flujo duradero de subida de pruebas.

## Usuarios

- Capitan: registra equipo, revisa plantilla, confirma presencia y reporta resultados.
- Jugador: consulta plantilla y estado de partida a traves del panel del capitan.
- Administracion: revisa registros y preparacion de partidas.
- Visitante: consulta estado publico, clasificacion, noticias y contexto de cuadro.

## Forma del Producto

El panel debe sentirse como una consola tactica en vivo.

Zonas prioritarias:

- Estado de mision: registro, plantilla, fase del torneo y fecha limite.
- Sala lista: siguiente partida, rival, presencia, instrucciones y acciones.
- Integridad de plantilla: cantidad de jugadores, titulares, suplente y riesgos.

La pagina de cuadro se transforma en sala lista cuando existe siguiente partida:

- Tarjetas de rival con nombres y metadatos.
- Modulo de presencia con urgencia clara.
- Acciones para confirmar presencia, reportar resultado y abrir disputa.
- Lectura del estado de partida: programada, lista, en directo, reportada, disputada o completada.

La pagina de plantilla se vuelve una camara de plantilla:

- Mantiene tarjetas de jugador.
- Muestra titularidad y suplente con mas claridad.
- Explica por que la plantilla esta fijada, pendiente o bloqueada.

## Arquitectura

Rutas:

- `/dashboard`: actividad de mision para capitan.
- `/dashboard/roster`: plantilla con estado de integridad.
- `/dashboard/brackets`: lista de partidas y sala lista.
- `/dashboard/admin`: sala de control protegida por `users.role === "admin"`.

Modulos:

- `src/features/tournaments/queries.ts`: mision de capitan y cola de administracion.
- `src/features/brackets/queries.ts`: siguiente partida y datos de sala lista.
- `src/features/matchday/status.ts`: ayudantes puros y texto de UI.
- `src/features/matchday/actions.ts`: acciones de servidor para presencia.

Componentes:

- `mission-feed.tsx`
- `ready-room-panel.tsx`
- `squad-integrity-panel.tsx`
- `match-action-panel.tsx`
- `admin-signal-card.tsx`

## Modelo de Datos

La primera fase deriva el estado de campos existentes:

- Estado de registro desde `tournament_registrations.status`.
- Presencia desde `tournament_registrations.checked_in_at`.
- Completitud de plantilla desde `team_members`.
- Estado de partida desde `matches.status`, `scheduled_at`, puntuaciones y equipos.

No se cambia el esquema en esta fase. Los campos de reporte y disputa quedan reservados para una migracion posterior.

## Flujo de Datos

Panel de capitan:

1. Autenticar con `auth()`.
2. Cargar el ultimo registro del usuario.
3. Cargar plantilla y siguiente partida.
4. Derivar celdas de mision.
5. Mostrar estados alternativos si no hay registro o partida.

Sala lista:

1. Autenticar con `auth()`.
2. Resolver la inscripcion activa del capitan.
3. Cargar la partida relevante con ambos equipos.
4. Mostrar acciones segun estado de partida y registro.
5. Validar propiedad y estado en cada mutacion.

Administracion:

1. Leer `users.role`.
2. Cargar registros con equipo, capitan, cantidad de jugadores, presencia y asignacion.
3. Permitir decisiones de estado en fases posteriores.

## Errores

- Usuarios sin sesion redirigen a `/sign-in`.
- Capitanes sin equipo ven un estado vacio con accion hacia `/register`.
- Registros pendientes muestran texto de revision, no acciones de partida.
- Acciones de presencia fallan si el usuario no es capitan del equipo.
- Los errores se redactan en espanol claro y no exponen detalles de base de datos.

## Diseno Visual

- Fondo oscuro con arte de arena en baja opacidad.
- Rojo para accion, peligro, directo y tension.
- Hueso para titulos y estados confirmados.
- Verde solo para senales verificadas o listas.
- Paneles angulares, bordes tecnicos y metadatos densos.
- Movimiento de bloqueo, escaneo y revelado.
- Sin tarjetas anidadas dentro de tarjetas.

## Pruebas

Ejecutar:

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

Pasada manual:

- `/`
- `/sign-in`
- `/dashboard`
- `/dashboard/roster`
- `/dashboard/brackets`

## Criterios de Aceptacion

- El capitan comprende su siguiente accion rapidamente.
- La pagina de cuadro funciona antes y despues de publicar enfrentamientos.
- La plantilla comunica preparacion y bloqueos.
- No hay regresiones en autenticacion, registro ni navegacion.
- La UI sigue unificada con la estetica tactica VALORANT.
