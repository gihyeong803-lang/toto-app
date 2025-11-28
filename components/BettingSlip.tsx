'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBetStore } from '@/store/useBetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useHistoryStore } from '@/store/useHistoryStore'; 

export default function BettingSlip() {
  const { bets, removeBet, clearBets, betMode, setBetMode } = useBetStore(); 
  const { user, isLoggedIn, logout, login } = useAuthStore(); 
  const { addToHistory } = useHistoryStore(); 
  const router = useRouter();

  const [stake, setStake] = useState<string>('10000');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // ★ [수정] 총 배당률 계산 (소수점 2자리 유지)
  const totalOdds = parseFloat(bets.reduce((acc, bet) => acc * bet.odds, 1).toFixed(2));
  const potentialWin = Math.floor(Number(stake) * totalOdds);

  const handlePlaceBet = async () => {
    if (!isLoggedIn || !user) {
      alert("로그인이 필요합니다.");
      router.push('/login');
      return;
    }
    
    if (bets.length === 0) {
      alert("배팅할 경기가 선택되지 않았습니다.");
      return;
    }

    const betAmount = parseInt(stake);
    if (isNaN(betAmount) || betAmount < 5000) {
        alert("최소 배팅 금액은 5,000원입니다.");
        return;
    }

    const currentMoney = (user as any).money || 0;
    if (currentMoney < betAmount) {
        alert(`보유 머니가 부족합니다.\n(현재 보유: ${currentMoney.toLocaleString()}원)`);
        return;
    }

    setIsLoading(true);

    // ★ [핵심 수정] 서버로 보낼 데이터 구조화
    // 단폴더일 때도 items 배열에 넣어서 보내는 것이 확장성에 좋습니다.
    const ticketItems = bets.map(b => ({
        matchId: parseInt(b.matchId.toString()), // ID가 문자열이면 숫자로 변환
        pick: b.selectedType === 'home' ? 'HOME' : b.selectedType === 'away' ? 'AWAY' : 'DRAW',
        odds: b.odds
    }));

    const payload = {
        userid: (user as any).userid, 
        stake: betAmount,
        ticket: {
            // 대표 ID (단폴더 호환용, 첫 번째 경기 기준)
            matchId: ticketItems[0].matchId, 
            pick: ticketItems[0].pick,
            // ★ 전체 배당률
            odds: totalOdds,
            // ★ 상세 내역 (다폴더 지원)
            items: ticketItems
        }
    };

    console.log("🚀 배팅 요청 데이터:", payload);

    try {
        // ★ API 주소는 본인 환경에 맞게 수정 (localhost 또는 IP)
        const res = await fetch('https://toto-server-f4j2.onrender.com/api/bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            // 1. 유저 잔액 갱신 (Zustand)
            if (user) login({ ...user, money: data.newBalance } as any);

            // 2. 로컬 히스토리 저장 (선택 사항, 마이페이지 API 연동 시 불필요할 수 있음)
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const newTicket = {
                id: uniqueId, 
                date: new Date().toLocaleString(),
                items: [...bets],
                totalOdds: totalOdds,
                stake: betAmount,
                potentialWin: potentialWin,
                status: 'pending' as const
            };
            addToHistory(newTicket);
            
            // 3. 초기화 및 이동
            clearBets(); 
            alert("✅ 배팅이 완료되었습니다!");
            router.push('/mypage'); 
        } else {
            alert(`❌ 배팅 실패: ${data.message}`); 
        }

    } catch (err: any) {
        console.error("배팅 에러:", err);
        alert(`서버 연결 오류: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <aside className="w-full bg-[#0b0e14] border-l border-slate-800 h-screen sticky top-0 flex flex-col shrink-0 font-sans z-50 shadow-2xl">
      
      <div className="p-5 pb-2">
        {isLoggedIn && user ? (
          <div className="bg-[#1a1d26] rounded-lg p-4 border border-slate-700/50 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">MY WALLET</span>
              <button onClick={() => logout()} className="text-[10px] text-slate-600 hover:text-white transition-colors">LOGOUT</button>
            </div>
            <div className="flex justify-end items-center">
               <span className="text-emerald-400 font-black font-mono text-xl tracking-tight">
                 ₩ {((user as any).money || 0).toLocaleString()}
               </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#1a1d26] rounded-lg p-4 border border-slate-700/50 shadow-lg text-center">
            <p className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-widest">GUEST USER</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" className="py-2 rounded-md bg-[#252a36] hover:bg-emerald-600 text-white text-xs font-bold transition-all border border-slate-600 hover:border-emerald-500">
                로그인
              </Link>
              <Link href="/register" className="py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all">
                회원가입
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎫</span>
          <span className="font-bold text-white text-base tracking-tight">Betting Slip</span>
          {bets.length > 0 && (
            <span className="bg-emerald-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-md">
              {bets.length}
            </span>
          )}
        </div>
        {bets.length > 0 && (
          <button onClick={clearBets} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider">
            Clear All
          </button>
        )}
      </div>

      {/* 배팅 모드 선택 탭 */}
      <div className="px-5 mb-2">
        <div className="grid grid-cols-3 text-center text-xs font-bold border-b border-slate-800">
          <button onClick={() => setBetMode('single')} className={`py-3 uppercase ${betMode === 'single' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}>Single</button>
          <button onClick={() => setBetMode('2fold')} className={`py-3 uppercase ${betMode === '2fold' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}>2-Fold</button>
          <button onClick={() => setBetMode('3fold')} className={`py-3 uppercase ${betMode === '3fold' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}>3-Fold</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3 [&::-webkit-scrollbar]:hidden">
        {bets.length === 0 ? (
          <div className="mt-2 border-2 border-dashed border-slate-800 rounded-xl h-48 flex flex-col items-center justify-center bg-[#11141d]">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-slate-500 text-sm font-medium text-center">경기를 선택하여<br/>슬립에 담아주세요.</p>
          </div>
        ) : (
          bets.map((bet) => (
            <div key={bet.id} className="bg-[#1a1d26] rounded-xl p-3 border border-slate-700/50 relative group hover:border-emerald-500/30 transition-all shadow-sm">
              <button onClick={() => removeBet(bet.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-400 transition-colors p-1">✕</button>
              <div className="flex items-center gap-2 mb-2">
                {bet.selectedType === 'home' && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">HOME 승</span>}
                {bet.selectedType === 'draw' && <span className="text-[10px] font-bold text-slate-400 bg-slate-400/10 px-1.5 py-0.5 rounded">DRAW 무</span>}
                {bet.selectedType === 'away' && <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">AWAY 패</span>}
              </div>
              <div className="text-sm font-bold text-slate-200 mb-2 truncate pr-6">{bet.teamName}</div>
              <div className="flex justify-between items-center bg-[#14161f] p-2 rounded-lg">
                <span className="text-[10px] text-slate-500">배당률</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{bet.odds.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {bets.length > 0 && (
        <div className="p-5 bg-[#1a1d26] border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-400 font-medium">Total Odds</span>
            <span className="text-white font-bold font-mono text-lg">{totalOdds.toFixed(2)}</span>
          </div>
          <div className="mb-4 relative">
            <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Stake</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₩</span>
              <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} className="w-full bg-[#14161f] border border-slate-700 rounded-lg py-3 pl-9 pr-4 text-white font-bold text-right focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-600" />
            </div>
          </div>
          <div className="flex justify-between items-center mb-5 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
            <span className="text-xs text-emerald-200">Win Amount</span>
            <span className="font-black text-emerald-400 font-mono text-xl">₩ {potentialWin.toLocaleString()}</span>
          </div>
          <button 
            onClick={handlePlaceBet}
            disabled={isLoading}
            className={`w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 uppercase tracking-widest text-sm
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'PROCESSING...' : 'PLACE BET'}
          </button>
        </div>
      )}
    </aside>
  );
}