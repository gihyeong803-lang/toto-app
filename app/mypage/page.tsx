'use client';

// ★ [필수] 캐싱 방지
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface MatchDetails {
  home: string;
  away: string;
  score: { home: number; away: number };
  status: string;
}

interface BetItem {
  matchId: number;
  pick: string;
  odds: number;
}

interface Bet {
  _id: string;
  matchId: number;
  pick: 'HOME' | 'DRAW' | 'AWAY';
  stake: number;
  odds: number;
  status: 'PENDING' | 'WIN' | 'LOSE';
  betTime: string;
  items?: BetItem[];
  matchDetails?: MatchDetails | null; 
}

interface Match {
  id: number;
  home: string;
  away: string;
  score: { home: number; away: number };
  status: string; 
}

// [수정됨] 팀 로고 매핑 함수 (선덜랜드 및 챔피언십 팀 완벽 지원)
const getTeamLogo = (teamName: string) => {
  const name = teamName?.toLowerCase() || '';
  const baseUrl = 'https://resources.premierleague.com/premierleague/badges/50'; // PNG 경로로 통일

  // --- 프리미어리그 (PL) ---
  if (name.includes('arsenal')) return `${baseUrl}/t3.png`;
  if (name.includes('aston villa')) return `${baseUrl}/t7.png`;
  if (name.includes('bournemouth')) return `${baseUrl}/t91.png`;
  if (name.includes('brentford')) return `${baseUrl}/t94.png`;
  if (name.includes('brighton')) return `${baseUrl}/t36.png`;
  if (name.includes('chelsea')) return `${baseUrl}/t8.png`;
  if (name.includes('crystal palace')) return `${baseUrl}/t31.png`;
  if (name.includes('everton')) return `${baseUrl}/t11.png`;
  if (name.includes('fulham')) return `${baseUrl}/t54.png`;
  if (name.includes('liverpool')) return `${baseUrl}/t14.png`;
  if (name.includes('luton')) return `${baseUrl}/t102.png`;
  if (name.includes('man city') || name.includes('manchester city')) return `${baseUrl}/t43.png`;
  if (name.includes('man utd') || name.includes('manchester united')) return `${baseUrl}/t1.png`;
  if (name.includes('newcastle')) return `${baseUrl}/t4.png`;
  if (name.includes('nottingham')) return `${baseUrl}/t17.png`;
  if (name.includes('sheffield')) return `${baseUrl}/t49.png`;
  if (name.includes('tottenham')) return `${baseUrl}/t6.png`;
  if (name.includes('west ham')) return `${baseUrl}/t21.png`;
  if (name.includes('wolves') || name.includes('wolverhampton')) return `${baseUrl}/t39.png`;
  if (name.includes('burnley')) return `${baseUrl}/t90.png`;

  // --- 챔피언십 / 강등팀 (선덜랜드 포함) ---
  if (name.includes('sunderland')) return `${baseUrl}/t56.png`; // ★ 선덜랜드 해결!
  if (name.includes('leeds')) return `${baseUrl}/t2.png`;      
  if (name.includes('leicester')) return `${baseUrl}/t13.png`; 
  if (name.includes('southampton')) return `${baseUrl}/t20.png`;
  if (name.includes('watford')) return `${baseUrl}/t57.png`;
  if (name.includes('norwich')) return `${baseUrl}/t45.png`;
  if (name.includes('west brom')) return `${baseUrl}/t35.png`;
  if (name.includes('stoke')) return `${baseUrl}/t110.png`;
  if (name.includes('hull')) return `${baseUrl}/t88.png`;
  if (name.includes('middlesbrough')) return `${baseUrl}/t25.png`;
  if (name.includes('blackburn')) return `${baseUrl}/t3.png`; 

  // 로고 없으면 기본 이미지
  return 'https://www.premierleague.com/resources/rebrand/v7.134.0/i/badge-placeholder.png'; 
};

export default function MyPage() {
  const { user, login } = useAuthStore();
  const router = useRouter();
  
  const [bets, setBets] = useState<Bet[]>([]);
  const [matches, setMatches] = useState<Match[]>([]); 
  const [loading, setLoading] = useState(true);

  const hasAlerted = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let currentUserId = (user as any)?.userid;
        
        if (!currentUserId) {
            currentUserId = localStorage.getItem('userid') || sessionStorage.getItem('userid');
        }

        if (!currentUserId) {
          if (!hasAlerted.current) {
             hasAlerted.current = true;
             alert('로그인이 필요한 서비스입니다.');
             router.push('/login');
          }
          return;
        }

        const userRes = await fetch('https://toto-server-f4j2.onrender.com/api/user/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid: currentUserId }),
            cache: 'no-store'
        });
        const userData = await userRes.json();
        
        if (userData.success) {
            login(userData.user);
        } else {
            localStorage.removeItem('userid');
            sessionStorage.removeItem('userid');
            
            if (!hasAlerted.current) {
                hasAlerted.current = true;
                alert('회원 정보가 유효하지 않습니다.');
                router.push('/login');
            }
            return;
        }

        const betRes = await fetch(`https://toto-server-f4j2.onrender.com/api/my-bets?userid=${currentUserId}&t=${Date.now()}`, {
            cache: 'no-store'
        });
        const betData = await betRes.json();

        const matchRes = await fetch(`https://toto-server-f4j2.onrender.com/api/matches?t=${Date.now()}`, {
            cache: 'no-store'
        });
        const matchData = await matchRes.json();

        if (betData.success) setBets(betData.bets);
        setMatches(matchData);

      } catch (err) {
        console.error('데이터 로딩 실패', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCancelBet = async (betId: string) => {
    if (!confirm('정말 이 배팅을 취소하시겠습니까?\n취소 시 배팅금은 즉시 환불됩니다.')) return;

    try {
        const currentUserId = (user as any)?.userid || localStorage.getItem('userid') || sessionStorage.getItem('userid');
        
        const res = await fetch('https://toto-server-f4j2.onrender.com/api/bet/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                betId, 
                userid: currentUserId 
            })
        });
        const data = await res.json();

        if (data.success) {
            alert(data.message);
            setBets(prev => prev.filter(b => b._id !== betId));
            window.location.reload();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('서버 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (bet: Bet, matchData: MatchDetails | Match | null | undefined) => {
    if (bet.status === 'WIN') {
        return <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded text-xs font-bold border border-emerald-500/30">WIN (적중)</span>;
    }
    if (bet.status === 'LOSE') {
        return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold border border-red-500/30">LOSE (미적중)</span>;
    }

    if (bet.items && bet.items.length > 1) {
       return <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded text-xs font-bold border border-purple-500/30">MULTI ({bet.items.length})</span>;
    }

    if (!matchData) return <span className="text-slate-500 text-xs">정보 없음</span>;

    switch (matchData.status) {
        case 'FINISHED': case 'FT':
            return <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs font-bold border border-yellow-500/30 animate-pulse">정산 중...</span>;
        case 'IN_PLAY': case 'PAUSED': case '1H': case 'HT': case '2H': case 'LIVE':
            return <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30 flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> 경기 중</span>;
        default:
            return <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-bold border border-slate-600">경기 전 (대기)</span>;
    }
  };

  if (loading) {
     return <div className="min-h-screen bg-[#12141e] p-4 flex justify-center items-center text-slate-500">로딩 중...</div>;
  }

  if (!user && !localStorage.getItem('userid') && !sessionStorage.getItem('userid')) return null;

  const displayName = user?.name || '회원';
  const displayMoney = (user as any)?.money || 0;

  return (
    <div className="min-h-screen bg-[#12141e] p-4 pb-24">
      <div className="max-w-3xl mx-auto">
        
        <header className="flex justify-between items-end mb-10 mt-6">
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-wider">
              MY PAGE
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              내 정보와 배팅 내역을 한눈에 확인하세요.
            </p>
          </div>
          <Link href="/" className="text-slate-400 hover:text-white text-sm mb-1 font-bold">
            ← 메인으로
          </Link>
        </header>

        <div className="bg-gradient-to-r from-[#1e2130] to-[#2a2e42] p-6 rounded-2xl shadow-xl border border-slate-700/50 mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold mb-1">WELCOME BACK</p>
            <h2 className="text-3xl font-bold text-white mb-4">{displayName} 님</h2>
            <div className="flex items-end gap-2">
              <span className="text-slate-400 text-sm mb-1">보유 머니</span>
              <span className="text-3xl font-black text-emerald-400">{displayMoney.toLocaleString()}</span>
              <span className="text-emerald-400 text-sm mb-1">원</span>
            </div>
          </div>
        </div>

        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          🎲 배팅 히스토리
          <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full text-slate-300">{bets.length}</span>
        </h3>

        {bets.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-500 mb-4">아직 배팅한 내역이 없습니다.</p>
            <Link href="/" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-emerald-500">경기 보러가기</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => {
              const match = bet.matchDetails || matches.find((m) => m.id === bet.matchId);
              const isWin = bet.status === 'WIN';
              const isMulti = bet.items && bet.items.length > 1;
              const canCancel = bet.status === 'PENDING' && match && 
                                (match.status === 'SCHEDULED' || match.status === 'TIMED' || match.status === 'UPCOMING');

              return (
                <div key={bet._id} className="bg-[#1e2130] rounded-xl p-5 border border-slate-700/50 shadow-lg relative overflow-hidden">
                  
                  {canCancel && (
                    <button 
                        onClick={() => handleCancelBet(bet._id)}
                        className="absolute top-5 right-28 bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white text-[10px] px-2 py-1 rounded border border-slate-600 transition-colors z-20"
                    >
                        배팅 취소
                    </button>
                  )}

                  <div className="flex justify-between items-start mb-4">
                      <div className="text-xs text-slate-500">{new Date(bet.betTime).toLocaleString()}</div>
                      {getStatusBadge(bet, match)}
                  </div>

                  <div className="mb-4">
                    {isMulti && bet.items ? (
                      <div className="space-y-2">
                        {bet.items.map((item, idx) => {
                            const itemMatch = matches.find(m => m.id === item.matchId);
                            const homeName = itemMatch ? itemMatch.home : `Team A (ID:${item.matchId})`;
                            const awayName = itemMatch ? itemMatch.away : `Team B`;

                            return (
                                <div key={idx} className="flex items-center justify-between bg-[#161925] p-3 rounded-lg border border-slate-700">
                                    <div className="flex items-center gap-2 w-[40%] justify-end">
                                        <div className="relative w-5 h-5 flex-shrink-0"><Image src={getTeamLogo(homeName)} alt={homeName} fill className="object-contain" /></div>
                                        <span className="text-xs text-white font-bold truncate">{homeName}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold">VS</div>
                                    <div className="flex items-center gap-2 w-[40%] justify-start">
                                        <div className="relative w-5 h-5 flex-shrink-0"><Image src={getTeamLogo(awayName)} alt={awayName} fill className="object-contain" /></div>
                                        <span className="text-xs text-white font-bold truncate">{awayName}</span>
                                    </div>
                                    <div className="ml-2">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded
                                            ${item.pick === 'HOME' ? 'text-red-400 bg-red-900/20' : 
                                              item.pick === 'AWAY' ? 'text-blue-400 bg-blue-900/20' : 'text-slate-400 bg-slate-700/20'}`}>
                                            {item.pick === 'HOME' ? '승' : item.pick === 'AWAY' ? '패' : '무'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                      </div>
                    ) : (
                      match ? (
                        <div className="flex items-center justify-between text-white font-bold text-lg bg-[#161925] p-3 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-3 w-1/3 justify-end">
                            <div className="relative w-6 h-6 flex-shrink-0">
                                <Image src={getTeamLogo(match.home)} alt={match.home} fill className="object-contain" />
                            </div>
                            <span className="text-right truncate">{match.home}</span>
                          </div>
                          <div className="flex flex-col items-center w-[20%]">
                            {match.status !== 'SCHEDULED' && match.status !== 'TIMED' && match.status !== 'UPCOMING' ? (
                               <div className="text-center text-emerald-400 font-black text-xl mt-1 tracking-widest">
                                 {match.score.home} : {match.score.away}
                               </div>
                            ) : (
                               <span className="text-slate-500 text-sm px-2">vs</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 w-1/3 justify-start">
                            <div className="relative w-6 h-6 flex-shrink-0">
                                <Image src={getTeamLogo(match.away)} alt={match.away} fill className="object-contain" />
                            </div>
                            <span className="text-left truncate">{match.away}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-center py-4">경기 정보를 불러올 수 없습니다. (ID: {bet.matchId})</div>
                      )
                    )}
                  </div>
                  <div className="bg-[#161925] rounded-lg p-3 flex justify-between items-center text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs">나의 선택</span>
                      <div className="flex items-center gap-2">
                        {!isMulti && (
                            <span className={`font-bold 
                                ${bet.pick === 'HOME' ? 'text-red-400' : bet.pick === 'AWAY' ? 'text-blue-400' : 'text-slate-400'}
                            `}>
                                {bet.pick === 'HOME' ? '홈 승' : bet.pick === 'DRAW' ? '무승부' : '원정 승'}
                            </span>
                        )}
                        <span className="text-slate-500 ml-1 text-xs">x {bet.odds.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs text-slate-400 mb-1">Bet: <span className="text-white font-bold">{bet.stake.toLocaleString()}</span></div>
                       <div className={`text-sm font-black ${bet.status === 'WIN' ? 'text-emerald-400' : bet.status === 'LOSE' ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                         Win: <span>{Math.floor(bet.stake * bet.odds).toLocaleString()}</span> <span className="text-[10px]">KRW</span>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}