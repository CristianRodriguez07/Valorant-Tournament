# Diseno de la Plataforma Competitiva de Doble Eliminacion

## Estado

Alcance aprobado el 2026-05-07. La direccion elegida es competicion e identidad: motor real de doble eliminacion, superficies visuales de cuadro y primera base duradera para perfiles, historial y clasificacion.

## Problema

La app ya tenia identidad VALORANT, panel de capitan, preparacion de plantilla, revision de administracion, presencia, reporte de resultados, disputas y mesa de resultados. Faltaba que el torneo tuviera una estructura competitiva real. La creacion anterior de partida no entendia cabezas de serie, cuadro superior, cuadro inferior, eliminaciones, descansos, gran final ni avance automatico.

Sin verdad de cuadro, las funciones posteriores quedan superficiales:

- El historial no distingue si una victoria fue en cuadro superior, inferior, eliminacion o final.
- La clasificacion no separa progreso real de partidas aisladas.
- Administracion no puede publicar ni avanzar el torneo con confianza.
- Capitanes no entienden su camino completo.

## Objetivos

- Generar un cuadro de doble eliminacion desde equipos aprobados o con presencia confirmada.
- Usar `tournament_registrations.seed` como primera fuente de cabeza de serie.
- Soportar cantidades no potencia de dos con descansos.
- Sustituir partida ficticia por publicacion de cuadro.
- Avanzar equipos automaticamente cuando administracion completa un resultado reportado.
- Enviar perdedores del cuadro superior a la plaza correcta del inferior.
- Marcar eliminacion tras segunda derrota.
- Crear experiencia visual de cuadro superior e inferior.
- Crear base de historial y clasificacion desde partidas completadas.
- Preservar la UI tactica VALORANT.

## Fuera de Alcance

- Formato suizo, liga o grupos.
- Automatizacion de Discord.
- Notificaciones.
- Subida de pruebas.
- Busqueda de equipo.
- API de Riot.
- Sockets en tiempo real.
- Variantes configurables de gran final.
- Ruta publica dedicada para cuadro.

## Usuarios

- Administracion: asigna cabezas de serie, publica cuadro, revisa resultados y avanza torneo.
- Capitan: consulta partida actual, ruta de cuadro, riesgo del cuadro inferior e historial.
- Jugador: gana identidad competitiva mediante historial y clasificacion.
- Visitante: ve un torneo creible, no solo promesas de marketing.

## Forma del Producto

### Tablero de Cabezas de Serie

La sala de administracion gana una seccion para cada torneo activo. Muestra equipos elegibles, preparacion de plantilla, estado de registro, cabeza de serie actual y aptitud para el cuadro. La publicacion solo se permite con al menos dos equipos.

Reglas iniciales:

- Preferir `tournament_registrations.seed`.
- Rellenar huecos por orden de aprobacion o presencia.
- Evitar duplicados durante la generacion.
- Mostrar avisos de semillas ausentes, duplicadas, cantidad impar y equipos sin presencia.

### Publicacion de Cuadro

Publicar crea toda la estructura:

- Rondas de cuadro superior.
- Rondas de cuadro inferior.
- Gran final.
- Final de reinicio condicional.
- Avances por descanso.
- Plazas futuras vacias que reciben equipos al avanzar.

Solo las partidas iniciales con dos equipos quedan listas para jugar. Las futuras permanecen programadas y la UI las muestra como equipos pendientes.

### Ruta de Capitan

El panel y la pagina de cuadro deben mostrar:

- Partida actual y rival.
- Estado de cuadro superior, cuadro inferior, eliminado o campeon.
- Posible plaza al ganar y al perder cuando se conozca.
- Historial con victorias, derrotas y fase.

La sala lista sigue siendo la superficie de accion principal; el cuadro es el mapa estrategico.

### Cuadro Visual

Una representacion compartida se adapta por contexto:

- Administracion: estado, plazas sin resolver, avisos y avance.
- Capitan: equipo resaltado, partida actual, ruta de peligro y siguiente rival.
- Publico futuro: lectura limpia tipo retransmision.

Direccion visual:

- Cuadro superior como carril principal iluminado en rojo.
- Cuadro inferior como carril compacto de supervivencia.
- Marcadores de eliminacion y momento de campeon.
- Tarjetas de partida con equipo, cabeza de serie, marcador, estado y formato.
- Sin pilas de tarjetas anidadas.

## Arquitectura

Modulos nuevos:

- `src/features/brackets/double-elimination.ts`
- `src/features/brackets/double-elimination.test.ts`
- `src/features/brackets/types.ts`
- `src/features/brackets/actions.ts`
- `src/features/profiles/queries.ts`
- `src/components/dashboard/double-elim-bracket.tsx`
- `src/components/dashboard/seed-board.tsx`
- `src/components/dashboard/player-history-panel.tsx`

Modulos existentes a ampliar:

- `src/db/schema.ts`
- `src/features/admin/actions.ts`
- `src/features/admin/match-review.ts`
- `src/features/brackets/queries.ts`
- `src/features/tournaments/queries.ts`
- `src/app/(dashboard)/dashboard/admin/page.tsx`
- `src/app/(dashboard)/dashboard/brackets/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`

## Modelo de Datos

Campos anadidos a `matches`:

- `bracket`: `upper`, `lower`, `grand_final`, `grand_final_reset`.
- `bracketRound`.
- `bracketMatchNumber`.
- `nextMatchId`.
- `nextMatchSlot`: `team_a`, `team_b`.
- `loserNextMatchId`.
- `loserNextMatchSlot`: `team_a`, `team_b`.
- `sourceMatchAId`.
- `sourceMatchBId`.

Tabla `tournament_team_standings`:

- Torneo.
- Equipo.
- Cabeza de serie.
- Victorias.
- Derrotas.
- Estado: `active`, `lower_bracket`, `eliminated`, `runner_up`, `champion`.
- Ultima partida.
- Fechas.

Tabla `tournament_player_snapshots`:

- Torneo.
- Equipo.
- Usuario opcional.
- Riot ID.
- Rol.
- Capitania.
- Cabeza de serie.
- Fechas.

## Reglas de Generacion

1. Cargar inscripciones elegibles.
2. Ordenar por cabeza de serie ascendente.
3. Calcular tamano como siguiente potencia de dos.
4. Colocar equipos con emparejamiento equilibrado.
5. Crear primera ronda de cuadro superior.
6. Crear rondas futuras, cuadro inferior y gran final.
7. Conectar ganadores.
8. Conectar perdedores.
9. Avanzar ganadores del cuadro inferior.
10. Conectar finalistas a gran final.
11. Crear final de reinicio solo si corresponde.
12. Avanzar descansos automaticamente.
13. Crear clasificacion y capturas en la misma transaccion.

## Reglas de Avance

Cuando administracion completa una partida reportada:

1. Validar que el estado sea `reported`.
2. Validar que el ganador pertenezca a la partida.
3. Calcular perdedor.
4. Marcar partida como completada.
5. Sumar victoria al ganador.
6. Sumar derrota al perdedor.
7. Mover ganador a su siguiente plaza.
8. Mover perdedor a su plaza inferior si existe.
9. Marcar eliminado si acumula dos derrotas.
10. Resolver campeon o subcampeon en gran final.
11. Crear final de reinicio si gana el finalista del cuadro inferior.
12. Marcar lista una partida cuando ya tenga dos equipos.
13. Revalidar rutas de administracion, panel, cuadro, plantilla y publica.

## Historial y Clasificacion

La fase no construye un producto social completo, pero deja superficies utiles:

- Panel de capitan con registro del equipo.
- Pagina de cuadro con historial de partidas del equipo.
- Pagina de administracion con clasificacion ordenada.
- Consultas reutilizables para futuras rutas de perfil.

Orden de clasificacion:

1. Campeon.
2. Equipos activos en cuadro superior.
3. Equipos activos en cuadro inferior.
4. Equipos eliminados por profundidad, victorias y cabeza de serie.

No se inventa ELO en esta fase; la posicion del torneo es suficiente.

## Errores

- Publicar requiere rol de administracion.
- Publicar requiere al menos dos equipos elegibles.
- Publicar rechaza cuadros duplicados.
- Completar falla si la partida esta disputada, completada o sin ganador valido.
- El avance falla de forma transaccional.
- Capitanes sin cuadro ven estado pendiente.
- Equipos eliminados ven historial y posicion final.

## Pruebas

Pruebas puras:

- Dos equipos con gran final y final de reinicio condicional.
- Cuatro equipos con cuadro superior, inferior y gran final.
- Seis equipos con descansos.
- Semillas duplicadas o ausentes resueltas de forma determinista.
- Perdedor de cuadro superior cae a plaza inferior correcta.
- Perdedor de cuadro inferior queda eliminado.
- Ganador de gran final desde cuadro superior queda campeon.
- Ganador de gran final desde cuadro inferior crea final de reinicio.
- Disputas y estados no avanzan incorrectamente.

Verificacion manual:

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

Rutas:

- `/`
- `/sign-in`
- `/dashboard`
- `/dashboard/brackets`
- `/dashboard/admin`

## Criterios de Aceptacion

- Administracion publica cuadro desde equipos aprobados o con presencia.
- El sistema crea cuadro superior, inferior y gran final.
- Los descansos se manejan automaticamente.
- Completar una partida mueve ganador y perdedor correctamente.
- Dos derrotas eliminan.
- La gran final marca campeon o crea final de reinicio.
- Capitanes ven partida actual, posicion e historial.
- Administracion ve clasificacion y salud del cuadro.
- La UI conserva la estetica tactica VALORANT.

## Decisiones Cerradas

- La gran final usa reinicio solo si gana el finalista del cuadro inferior.
- La asignacion de cabezas de serie es determinista, no de arrastrar y soltar.
- La clasificacion se basa en posicion de torneo, no en ELO.
- Discord, pruebas y busqueda de equipo quedan fuera hasta una fase posterior.
