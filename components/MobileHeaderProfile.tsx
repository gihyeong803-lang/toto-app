'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBetStore } from '@/store/useBetStore';

export default function MobileHeaderProfile() {
  const { user, logout } = useAuthStore();
  const { clearBets } = useBetStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      localStorage.removeItem('userid');
      sessionStorage.removeItem('userid');
      clearBets();
      router.push('/login');
    }
  };

  // 1. 비로그인 상태 -> 로그인 버튼
  if (!user) {
    return (
      <button 
        onClick={() => router.push('/login')} 
        className="md:hidden text-[10px] font-bold text-emerald-400 border border-emerald-500/50 bg-emerald-900/20 px-3 py-1.5 rounded-full hover:bg-emerald-500 hover:text-black transition-all"
      >
        LOGIN
      </button>
    );
  }

  // 2. 로그인 상태 -> 이름 + 로그아웃 아이콘
  return (
    <div className="flex items-center gap-2 md:hidden"> {/* PC에선 숨김 */}
      <div className="text-right mr-1">
        <p className="text-[9px] text-slate-500 leading-none mb-0.5">Welcome</p>
        <p className="text-xs font-bold text-white leading-none">{user.name}님</p>
      </div>
      
      <button
        onClick={handleLogout}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-colors"
        aria-label="로그아웃"
      >
        {/* 로그아웃 아이콘 */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
      </button>
    </div>
  );
}