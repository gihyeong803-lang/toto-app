import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// BetItem 타입 정의에 result 필드를 추가합니다.
// 이 파일은 useBetStore.ts에서 BetItem을 import하므로, BetItem 타입 정의를 직접 수정해야 합니다.
// (여기서는 useHistoryStore.ts 파일만 제공하므로, BetItem에 result가 포함된 것으로 가정하고 코드를 수정합니다.)
import { BetItem } from './useBetStore'; 

// BetTicket은 이제 items 배열 안에 result 필드를 가진 BetItem을 포함합니다.
export interface BetTicket {
  id: string;
  date: string;
  // items 배열 내부의 BetItem 타입에 result 속성이 추가되어야 합니다.
  items: Array<BetItem & { result?: 'win' | 'lose' | 'pending' | null }>; 
  totalOdds: number;
  stake: number;
  potentialWin: number;
  status: 'won' | 'lost' | 'pending';
}

interface HistoryStore {
  history: BetTicket[];
  addToHistory: (ticket: BetTicket) => void;
}

export const useHistoryStore = create(
  persist<HistoryStore>(
    (set) => ({
      history: [],
      addToHistory: (ticket) => set((state) => ({
        history: [ticket, ...state.history]
      })),
    }),
    {
      name: 'betting-history-v2', 
    }
  )
);