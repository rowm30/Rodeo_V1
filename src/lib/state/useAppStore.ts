import { create } from 'zustand';

interface Event {
  id: string;
  name: string;
}

interface Session {
  deviceId: string;
  isGuest: boolean;
}

interface AppState {
  currentEvent: Event;
  userSession: Session;
}

export const useAppStore = create<AppState>(() => ({
  currentEvent: { id: 'mock-evt-1', name: 'Uvalde Rodeo 2025' },
  userSession: { deviceId: 'MOCK-DEVICE', isGuest: true },
}));
