import { create } from 'zustand'

type UIState = {
  nerdMode: boolean
  setNerdMode: (v: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  nerdMode: false,
  setNerdMode: (v) => set({ nerdMode: v }),
}))
