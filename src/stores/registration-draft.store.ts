"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { RosterPlayerInput } from "@/features/registration/schemas";

type RegistrationDraftState = {
  teamName: string;
  players: RosterPlayerInput[];
  setTeamName: (teamName: string) => void;
  setPlayers: (players: RosterPlayerInput[]) => void;
  reset: () => void;
};

const initialState = {
  teamName: "",
  players: [],
};

export const useRegistrationDraftStore = create<RegistrationDraftState>()(
  persist(
    (set) => ({
      ...initialState,
      setTeamName: (teamName) => set({ teamName }),
      setPlayers: (players) => set({ players }),
      reset: () => set(initialState),
    }),
    {
      name: "valorant-registration-draft",
      partialize: (state) => ({ teamName: state.teamName, players: state.players }),
    },
  ),
);
