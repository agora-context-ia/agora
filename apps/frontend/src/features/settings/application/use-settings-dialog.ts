import { create } from 'zustand';

// El modal de Settings se abre desde varios lados (engranaje del sidebar,
// CTA del selector de modelo del chat), por eso el estado vive en un
// store y el dialog se renderiza una sola vez en el AppShell.
export type SettingsSection = 'general' | 'collaboration' | 'ai-models';

interface SettingsDialogState {
  isOpen: boolean;
  section: SettingsSection;
  open: (section?: SettingsSection) => void;
  close: () => void;
  setSection: (section: SettingsSection) => void;
}

/** Store controlling the Settings modal: open state and active section. */
export const useSettingsDialog = create<SettingsDialogState>((set) => ({
  isOpen: false,
  section: 'general',
  open: (section) => set((state) => ({ isOpen: true, section: section ?? state.section })),
  close: () => set({ isOpen: false }),
  setSection: (section) => set({ section }),
}));
