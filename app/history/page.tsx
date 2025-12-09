'use client';

import { useAuthStore } from '@/store/useAuthStore';     
import { useHistoryStore } from '@/store/useHistoryStore'; 
import { useEffect, useState } from 'react';
import Link from 'next/link';

// ★ [핵심] 이제 여기서 로고 함수를 가져옵니다! (중복 제거)
import { getTeamBadge } from '@/utils/footballApi';

// ❌ [삭제] 파일 안에 있던 옛날 getTeamLogo 함수는 이제 필요 없습니다.

export default function HistoryPage() {
  const { user } = useAuthStore();
  const { history } = useHistoryStore();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const myBets = history;
  const balance = user?.money || 0;

  const getStatusBadge = (status: string) => {
    if (status === 'won') {
      return (
        <span className="text-emerald-950 bg-emerald-400 font-bold text-xs px-2 py-1 rounded-md shadow-lg shadow-emerald-500/20">
          당첨 (WIN)
        </span>
      );
    }
    if (status === 'lost') {
      return (
        <span className="text-red-200 bg-red-900/80 font-bold text-xs px-2 py-1 rounded-md border border-red-700">
          낙첨 (LOSE)
        </span>
      );
    }
    return (
      <span className="text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 font-bold text-xs px-2 py-1 rounded-md">
        진행중 (Pending)
      </span>
    );
  };

  const getItemStyle = (result?: string | null) => {
    if (result === 'win') return 'text-emerald-400 font-bold'; 
    if (result === 'lose') return 'text-red-500 line-through opacity-60'; 
    return 'text-white'; 
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
      
      {/* 1. 헤더 */}
      <header className="mb-10">
        <h1 className="text-3xl font-black italic text-white flex items-center gap-3 mb-6 tracking-tighter uppercase">
          <span className="text-purple-400 not-italic text-4xl">👤</span> My Page
        </h1>

        <div className="flex flex-wrap gap-4">
          <div className="bg-[#1e2330] px-6 py-4 rounded-2xl border border-slate-700/50 shadow-lg min-w-[180px] hover:border-emerald-500/30 transition-all group">
            <span className="text-slate-400 text-[10px] block font-bold uppercase mb-1 tracking-wider group-hover:text-emerald-400">My Wallet</span>
            <span className="text-emerald-400 text-3xl font-black font-mono tracking-tight">
              ₩ {balance.toLocaleString()}
            </span>
          </div>
          <div className="bg-[#1e2330] px-6 py-4 rounded-2xl border border-slate-700/50 shadow-lg min-w-[180px] hover:border-white/30 transition-all group">
            <span className="text-slate-400 text-[10px] block font-bold uppercase mb-1 tracking-wider group-hover:text-white">Total Bets</span>
            <span className="text-white text-3xl font-black font-mono tracking-tight">
              {myBets.length} <span className="text-sm font-bold text-slate-500">Tickets</span>
            </span>
          </div>
        </div>
      </header>

      <div className="border-t border-slate-800 my-8"></div>

      {/* 2. 베팅 내역 리스트 섹션 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
          <h2 className="text-xl font-bold text-white tracking-wide">BETTING HISTORY</h2>
        </div>
      </div>

      {myBets.length === 0 ? (
        <div className="text-center py-32 bg-[#1a1d26] rounded-2xl border border-dashed border-slate-800 text-slate-500">
          <div className="text-5xl mb-4 opacity-30 grayscale">🧾</div>
          <p className="text-sm font-bold text-slate-400">아직 베팅 내역이 없습니다.</p>
          <Link href="/" className="text-emerald-500 font-bold text-xs hover:underline mt-3 inline-block">
            경기 목록 보러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {myBets.map((bet) => (
            <div key={bet.id as string} className="bg-[#161925] rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-slate-600 transition-all group">
              
              <div className="bg-[#1e2330] px-6 py-4 flex justify-between items-center border-b border-slate-800/50 group-hover:bg-[#232836] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Date</span>
                    <span className="text-xs text-slate-300 font-mono">{bet.date}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-700/50 mx-2"></div>
                  {getStatusBadge(bet.status)}
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase tracking-wider">Potential Win</span>
                  <span className="text-lg font-black font-mono text-emerald-400 tracking-tight">
                    ₩ {bet.potentialWin.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-5 bg-[#12141e]">
                <div className="space-y-2">
                  {bet.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#1a1d26] p-3 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* [수정됨] 중앙화된 로고 함수 사용 */}
                        <img 
                          src={getTeamBadge(item.teamName)} 
                          alt={item.teamName} 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://assets.codepen.io/t-1/premier-league-logo.png';
                          }}
                        />
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${getItemStyle(item.result)}`}>
                            {item.teamName}
                          </span>
                          <span className="text-[10px] text-slate-600">vs (Match ID: {item.matchId})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-3 py-1.5 rounded uppercase min-w-[60px] text-center tracking-wider border border-slate-700">
                          {item.selectedType}
                        </span>
                        <span className="text-slate-400 font-mono text-sm font-bold">
                          x{item.odds.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-3 bg-[#1a1d26] flex justify-between items-center border-t border-slate-800/50">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider">Total Odds</span>
                  <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">{bet.totalOdds.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider">Stake</span>
                  <span className="text-white font-mono font-bold text-sm">₩ {bet.stake.toLocaleString()}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}