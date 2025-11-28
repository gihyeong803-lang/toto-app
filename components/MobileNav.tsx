'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useBetStore } from '@/store/useBetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useState, useEffect } from 'react';
import BettingSlip from './BettingSlip'; 
import { House } from 'lucide-react'; // ★ 아이콘 임포트 추가

export function MobileNav() { 
  const pathname = usePathname();
  const router = useRouter();
  const { bets, clearBets } = useBetStore();
  const { user, logout } = useAuthStore();
  
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const totalStake = bets.reduce((sum, bet) => sum + 10000, 0);
  const estWinnings = Math.floor(totalStake * (bets.reduce((acc, bet) => acc * bet.odds, 1)));

  const moreMenuItems = [
    { name: '마이페이지', path: '/mypage', icon: '👤' },
    { name: '머니 충전소', path: '/charge', icon: '💰' },
    { name: '머니 환전소', path: '/exchange', icon: '💸' },
    { name: '경기 결과', path: '/results', icon: '📊' },
  ];

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      localStorage.removeItem('userid');
      sessionStorage.removeItem('userid');
      clearBets();
      setIsMoreOpen(false); 
      router.push('/login');
    }
  };

  const handleMenuClick = () => {
    setIsMoreOpen(false);
  };

  const goToLogin = () => {
    setIsSlipOpen(false);
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <>
      {/* ================= [1] 배팅 슬립 모달 ================= */}
      {isSlipOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-[#161925] h-full ml-auto flex flex-col animate-slideUp md:animate-slideLeft shadow-2xl">
            <div className="p-4 border-b border-slate-700 bg-[#1e2130] flex justify-between items-center">
              <h2 className="text-white font-bold flex items-center gap-2">
                🧾 배팅 슬립 <span className="bg-emerald-600 text-[10px] px-2 py-0.5 rounded-full">{bets.length}</span>
              </h2>
              <button onClick={() => setIsSlipOpen(false)} className="text-slate-400 hover:text-white p-2 text-lg">✕</button>
            </div>

            <div className="p-4 bg-[#161925] border-b border-slate-800">
              {user ? (
                <div className="flex items-center justify-between bg-[#1e2130] p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Welcome</p>
                      <p className="text-sm font-bold text-white">{user.name}님</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 bg-red-900/10 px-3 py-1.5 rounded transition-colors">
                    로그아웃
                  </button>
                </div>
              ) : (
                <button onClick={goToLogin} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                  <span>🔒</span> 로그인하러 가기
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
               <BettingSlip />
            </div>
          </div>
        </div>
      )}

      {/* ================= [2] 더보기 메뉴 모달 ================= */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={() => setIsMoreOpen(false)}>
          <div className="absolute bottom-20 left-0 w-full bg-[#1e2130] rounded-t-2xl border-t border-slate-700 p-4 animate-slideUp shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {user ? (
              <div className="flex items-center justify-between bg-[#161925] p-4 rounded-xl mb-4 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Welcome back</p>
                    <p className="text-white font-bold">{user.name}님</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-xs text-red-400 border border-red-900 bg-red-900/20 px-3 py-1.5 rounded hover:bg-red-900/40">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="bg-[#161925] p-4 rounded-xl mb-4 text-center border border-slate-700">
                <p className="text-slate-400 text-sm mb-3">로그인이 필요합니다.</p>
                <Link href="/login" onClick={handleMenuClick} className="block w-full bg-emerald-600 text-white py-2 rounded-lg font-bold text-sm">
                  로그인 / 회원가입
                </Link>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 mb-2">
              {moreMenuItems.map((item) => (
                <Link key={item.path} href={item.path} onClick={handleMenuClick} className="flex flex-col items-center justify-center bg-[#2a2e3e] p-3 rounded-xl hover:bg-slate-700 transition-colors active:scale-95">
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-[10px] text-slate-300 font-medium text-center leading-tight">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= [3] 플로팅 미니 배팅 바 ================= */}
      {bets.length > 0 && !isSlipOpen && !isMoreOpen && (
        <div 
          onClick={() => setIsSlipOpen(true)}
          className="md:hidden fixed bottom-24 left-4 right-4 bg-emerald-600 rounded-xl p-3 shadow-lg shadow-emerald-900/50 z-40 flex justify-between items-center cursor-pointer animate-bounce-small border border-emerald-400/30"
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-100 font-bold">현재 {bets.length}폴더 선택 중</span>
            <span className="text-sm font-black text-white">예상 당첨금: {estWinnings.toLocaleString()}원</span>
          </div>
          <div className="bg-white text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
            확인 &gt;
          </div>
        </div>
      )}

      {/* ================= [4] 하단 고정 내비게이션 바 ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#161925] border-t border-slate-800/50 z-50 pb-safe h-16">
        <div className="grid grid-cols-5 h-full items-end pb-1"> {/* items-end로 텍스트 라인 맞춤 */}
          
          {/* 1. 홈 (★ 이모지 -> 아이콘 교체됨) */}
          <Link href="/" onClick={() => setIsMoreOpen(false)} className={`flex flex-col items-center justify-center h-full w-full space-y-1 active:scale-90 transition-transform ${pathname === '/' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <House size={24} strokeWidth={pathname === '/' ? 2.5 : 2} className="mb-0.5" />
            <span className="text-[9px] font-bold">홈</span>
          </Link>

          {/* 2. 라이브 */}
          <Link href="/live" onClick={() => setIsMoreOpen(false)} className={`flex flex-col items-center justify-center h-full w-full space-y-1 active:scale-90 transition-transform ${pathname === '/live' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className="text-xl mb-0.5">🔴</span>
            <span className="text-[9px] font-bold">라이브</span>
          </Link>

          {/* 3. 슬립 (튀어나온 버튼) */}
          <div className="relative h-full w-full flex justify-center items-end pb-1">
            <button 
              onClick={() => { setIsSlipOpen(true); setIsMoreOpen(false); }}
              className="absolute -top-6 w-14 h-14 rounded-full bg-emerald-600 border-[4px] border-[#12141e] flex items-center justify-center shadow-lg shadow-emerald-900/50 active:scale-95 transition-transform z-10"
            >
              <span className="text-2xl">🧾</span>
              {bets.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#161925] animate-pulse">
                  {bets.length}
                </span>
              )}
            </button>
            {/* 버튼 아래 텍스트 (다른 메뉴와 높이 맞춤) */}
            <span className={`text-[9px] font-bold ${bets.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>슬립</span>
          </div>

          {/* 4. 예정 */}
          <Link href="/upcoming" onClick={() => setIsMoreOpen(false)} className={`flex flex-col items-center justify-center h-full w-full space-y-1 active:scale-90 transition-transform ${pathname === '/upcoming' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className="text-xl mb-0.5">📅</span>
            <span className="text-[9px] font-bold">예정</span>
          </Link>

          {/* 5. 더보기 */}
          <button onClick={() => setIsMoreOpen(!isMoreOpen)} className={`flex flex-col items-center justify-center h-full w-full space-y-1 active:scale-90 transition-transform ${isMoreOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className="text-xl mb-0.5">☰</span>
            <span className="text-[9px] font-bold">더보기</span>
          </button>

        </div>
      </nav>
    </>
  );
}