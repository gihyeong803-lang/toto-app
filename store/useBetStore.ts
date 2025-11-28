import { create } from 'zustand';

export interface BetItem {
  id: string;
  matchId: number;
  teamName: string;
  selectedType: 'home' | 'draw' | 'away';
  odds: number;
  status?: string;
}

// 모드 타입 정의
type BetMode = 'single' | '2fold' | '3fold';

interface BetStore {
  bets: BetItem[];
  betMode: BetMode; // 현재 선택된 모드
  setBetMode: (mode: BetMode) => void; // 모드 변경 함수
  addBet: (bet: BetItem) => void;
  removeBet: (id: string) => void;
  clearBets: () => void;
}

export const useBetStore = create<BetStore>((set) => ({
  bets: [],
  betMode: 'single', // 기본값 Single

  // 모드 변경 시 배팅 리스트 초기화 (선택사항: 사용자 경험에 따라 유지해도 됨)
  setBetMode: (mode) => set({ betMode: mode, bets: [] }),

  // [핵심] 배팅 추가 로직 수정
  addBet: (newBet) => set((state) => {
    // 1. 같은 경기를 눌렀을 때 (토글/교체 로직)
    const existingIndex = state.bets.findIndex((b) => b.matchId === newBet.matchId);
    if (existingIndex !== -1) {
      const existingBet = state.bets[existingIndex];
      // 같은 버튼 또 누르면 삭제 (선택 취소)
      if (existingBet.selectedType === newBet.selectedType) {
        return { bets: state.bets.filter((b) => b.matchId !== newBet.matchId) };
      }
      // 다른 버튼 누르면 교체 (승 -> 패)
      const updatedBets = [...state.bets];
      updatedBets[existingIndex] = newBet;
      return { bets: updatedBets };
    }

    // 2. 모드별 제한 로직 (Single일 때 1개만 유지)
    if (state.betMode === 'single') {
      // Single 모드면 기존 거 다 버리고 새거 1개만 넣음 (교체 방식)
      return { bets: [newBet] };
    } 
    
    // 2-Fold (최대 2개)
    if (state.betMode === '2fold' && state.bets.length >= 2) {
      alert("2-Fold는 2경기까지만 선택 가능합니다.");
      return state;
    }

    // 3-Fold (최대 3개)
    if (state.betMode === '3fold' && state.bets.length >= 3) {
      alert("3-Fold는 3경기까지만 선택 가능합니다.");
      return state;
    }

    // 제한 없으면 추가
    return { bets: [...state.bets, newBet] };
  }),

  removeBet: (id) => set((state) => ({
    bets: state.bets.filter((b) => b.id !== id)
  })),

  clearBets: () => set({ bets: [] }),
}));