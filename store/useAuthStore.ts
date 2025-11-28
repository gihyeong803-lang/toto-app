import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  userid: string;
  name: string;
  money: number;
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
  role?: 'user' | 'admin'; 
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  hasHydrated: boolean; 
  login: (user: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      hasHydrated: false, 

      // [수정 1] 불필요한 removeItem 제거 (Zustand가 알아서 덮어씌웁니다)
      login: (user) => {
        set({ user, isLoggedIn: true });
      },
      
      // [수정 2] 로그아웃 시 state만 초기화하면, 저장소도 알아서 비워집니다.
      // (강제로 파일을 지우는 것보다 빈 상태를 저장하는 게 훨씬 안전합니다)
      logout: () => {
        set({ user: null, isLoggedIn: false });
      },

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'auth-storage', // 이 이름으로 로컬스토리지에 저장됨
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);