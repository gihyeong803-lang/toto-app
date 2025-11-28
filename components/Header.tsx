'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react'; // ★ 추가됨

export default function Header() {
  const { user, isLoggedIn, logout, login } = useAuthStore(); // ★ login 함수 추가 (정보 갱신용)

  // =================================================================
  // [신규 기능] 3초마다 자동으로 서버에 "내 돈 얼마야?" 하고 물어봄
  // =================================================================
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const checkMoney = async () => {
      try {
        // 방금 server.js에 만든 그 주소로 요청
        const res = await fetch('http://localhost:4000/api/user/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid: (user as any).userid }),
        });
        const data = await res.json();
        
        // 돈이 다르면 업데이트! (화면이 깜빡이지 않고 숫자만 바뀜)
        if (data.success && data.user.money !== user.money) {
           // 기존 정보에 최신 돈만 덮어씌워서 저장
           login({ ...user, money: data.user.money } as any);
        }
      } catch (e) {
        // 조용히 넘어감 (에러나도 사용자 방해 안 함)
      }
    };

    // 3초마다 실행 (3000ms)
    const interval = setInterval(checkMoney, 3000);
    return () => clearInterval(interval); // 페이지 나가면 중지
  }, [isLoggedIn, user?.money]); 
  // =================================================================

  return (
    <header className="w-full h-16 bg-[#161925]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-end px-6 sticky top-0 z-50">
      
      {isLoggedIn && user ? (
        // A. 로그인 했을 때
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-white text-sm font-bold">{(user as any).nickname || user.name} 님</div>
            <div className="text-emerald-400 text-xs font-mono font-bold">
              ₩ {user.money?.toLocaleString() || 0}
            </div>
          </div>
          
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg border-2 border-emerald-500">
            🦁
          </div>

          <button 
            onClick={() => logout()}
            className="text-xs text-slate-400 hover:text-red-400 font-bold transition-colors ml-2"
          >
            로그아웃
          </button>
        </div>
      ) : (
        // B. 로그인 안 했을 때
        <div className="flex gap-3">
          <Link 
            href="/login" 
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-slate-700 hover:bg-slate-600 transition-all"
          >
            로그인
          </Link>
          <Link 
            href="/register" 
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all"
          >
            회원가입
          </Link>
        </div>
      )}
    </header>
  );
}