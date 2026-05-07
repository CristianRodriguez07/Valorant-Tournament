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
        <div className="concept-kicker">Result operations</div>
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
            Report 1-0 win
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
            Open dispute
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
      title: "Match signal idle",
      description: "Result controls arm after admin assigns a live bracket match.",
    };
  }

  if (!hasCheckIn) {
    return {
      title: "Check-in required",
      description: "Confirm captain presence before reporting a result or opening a dispute.",
    };
  }

  if (match.status === "reported") {
    return {
      title: "Result transmitted",
      description: "Your win report is queued for admin verification.",
    };
  }

  if (match.status === "disputed") {
    return {
      title: "Dispute channel open",
      description: "The match is flagged for admin review before the bracket advances.",
    };
  }

  if (match.status === "completed") {
    return {
      title: "Result locked",
      description: "Admin has confirmed the score and closed this match record.",
    };
  }

  return {
    title: "Result uplink armed",
    description: "Report a clean 1-0 win for your side or flag the match for admin review.",
  };
}
