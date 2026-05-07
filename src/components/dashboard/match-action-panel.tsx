import { FileWarning, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  openCaptainMatchDisputeFromForm,
  reportCaptainMatchResultFromForm,
} from "@/features/matchday/actions";
import type { ReadyRoomMatch } from "@/features/matchday/status";

type MatchActionPanelProps = {
  match?: ReadyRoomMatch | null;
  checkedInAt?: Date | null;
};

export function MatchActionPanel({ match, checkedInAt }: MatchActionPanelProps) {
  const hasCheckIn = Boolean(checkedInAt);
  const canMutateMatch = Boolean(match && hasCheckIn && match.status !== "completed");
  const reportDisabled = !canMutateMatch || match?.status === "reported" || match?.status === "disputed";
  const disputeDisabled = !canMutateMatch || match?.status === "disputed";
  const headline = getResultHeadline({ match, hasCheckIn });

  return (
    <section className="match-action-panel">
      <div>
        <div className="concept-kicker">Operaciones de resultado</div>
        <h3>{headline.title}</h3>
        <p>{headline.description}</p>
      </div>
      <div className="match-action-buttons">
        <form action={reportCaptainMatchResultFromForm}>
          {match?.id ? <input type="hidden" name="matchId" value={match.id} /> : null}
          <Button
            disabled={reportDisabled}
            variant="outline"
            className="arena-button-outline h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]"
          >
            <UploadCloud className="size-4" />
            Reportar victoria 1-0
          </Button>
        </form>
        <form action={openCaptainMatchDisputeFromForm}>
          {match?.id ? <input type="hidden" name="matchId" value={match.id} /> : null}
          <Button
            disabled={disputeDisabled}
            variant="outline"
            className="arena-button-outline h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]"
          >
            <FileWarning className="size-4" />
            Abrir disputa
          </Button>
        </form>
      </div>
    </section>
  );
}

function getResultHeadline({
  match,
  hasCheckIn,
}: {
  match?: ReadyRoomMatch | null;
  hasCheckIn: boolean;
}) {
  if (!match) {
    return {
      title: "Señal de partida inactiva",
      description: "Los controles de resultado se activan cuando administración asigna una partida del cuadro.",
    };
  }

  if (!hasCheckIn) {
    return {
      title: "Presencia requerida",
      description: "Confirma la presencia del capitán antes de reportar resultado o abrir disputa.",
    };
  }

  if (match.status === "reported") {
    return {
      title: "Resultado transmitido",
      description: "Tu reporte de victoria está en cola para verificación de administración.",
    };
  }

  if (match.status === "disputed") {
    return {
      title: "Canal de disputa abierto",
      description: "La partida queda marcada para revisión de administración antes de avanzar el cuadro.",
    };
  }

  if (match.status === "completed") {
    return {
      title: "Resultado cerrado",
      description: "Administración confirmó el marcador y cerró el registro de la partida.",
    };
  }

  return {
    title: "Enlace de resultado armado",
    description: "Reporta una victoria limpia 1-0 de tu lado o marca la partida para revisión de administración.",
  };
}
