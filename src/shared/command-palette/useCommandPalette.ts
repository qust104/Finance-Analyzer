import { create } from 'zustand'

// Command palette visibility is UI state, kept out of the query cache
// the same way the modal/form flags live in their own store.
interface CommandPaletteState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))