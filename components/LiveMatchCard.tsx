'use client';

import { useState, useEffect } from 'react';
// import Image from 'next/image'; 
import { useBetStore } from '../store/useBetStore';

// ★ [삭제됨] 가짜 배당 계산기는 이제 필요 없습니다.
// import { calculateLiveOdds } from '@/utils/oddsSystem';

// ★ [추가] 내 Render 서버 주소 (footballApi.ts와 동일하게 설정)
const API_BASE_URL = 'https://toto-server-f4j2.onrender.com'; 

interface MatchProps {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  matchTime: string; // "11. 30. 23:05" (한국 시간 문자열)
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  odds: { home: number; draw: number; away: number };
  score?: { home: number; away: number };
}

export default function LiveMatchCard({ match }: { match: MatchProps }) {
  const { addBet, bets } = useBetStore();
  
  // 1. 배당률 상태 (초기값은 props에서)
  const [liveOdds, setLiveOdds] = useState(match.odds);
  // 2. ★ [추가] 실시간 스코어 상태 (서버에서 가져온 최신 점수 반영용)
  const [liveScore, setLiveScore] = useState(match.score || { home: 0, away: 0 });
  
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 로고 매핑 함수 (유지)
  const getTeamBadge = (name: string) => {
    const lowerName = name?.toLowerCase() || '';
    // ... (기존 로고 로직 그대로 유지) ...
    const baseUrl = 'https://resources.premierleague.com/premierleague/badges';
    
    if (lowerName.includes('arsenal')) return `${baseUrl}/t3.svg`;
    if (lowerName.includes('villa')) return `${baseUrl}/t7.svg`;
    if (lowerName.includes('bournemouth')) return `${baseUrl}/t91.svg`;
    if (lowerName.includes('brentford')) return `${baseUrl}/t94.svg`;
    if (lowerName.includes('brighton')) return `${baseUrl}/t36.svg`;
    if (lowerName.includes('burnley')) return `${baseUrl}/t90.svg`;
    if (lowerName.includes('chelsea')) return `${baseUrl}/t8.svg`;
    if (lowerName.includes('palace')) return `${baseUrl}/t31.svg`;
    if (lowerName.includes('everton')) return `${baseUrl}/t11.svg`;
    if (lowerName.includes('fulham')) return `${baseUrl}/t54.svg`;
    if (lowerName.includes('ipswich')) return `${baseUrl}/t40.svg`;
    if (lowerName.includes('leicester')) return `${baseUrl}/t13.svg`;
    if (lowerName.includes('liverpool')) return `${baseUrl}/t14.svg`;
    if (lowerName.includes('luton')) return `${baseUrl}/t102.svg`;
    if (lowerName.includes('city')) return `${baseUrl}/t43.svg`;
    if (lowerName.includes('man utd') || lowerName.includes('united')) return `${baseUrl}/t1.svg`;
    if (lowerName.includes('newcastle')) return `${baseUrl}/t4.svg`;
    if (lowerName.includes('forest') || lowerName.includes('nottingham')) return `${baseUrl}/t17.svg`;
    if (lowerName.includes('southampton')) return `${baseUrl}/t20.svg`;
    if (lowerName.includes('sheffield')) return `${baseUrl}/t49.svg`;
    if (lowerName.includes('tottenham') || lowerName.includes('spurs')) return `${baseUrl}/t6.svg`;
    if (lowerName.includes('west ham')) return `${baseUrl}/t21.svg`;
    if (lowerName.includes('wolves') || lowerName.includes('wolverhampton')) return `${baseUrl}/t39.svg`;
    
    // 기타 팀들
    if (lowerName.includes('sunderland')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/366.png';
    if (lowerName.includes('leeds')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/357.png';
    
    return `https://assets.codepen.io/t-1/premier-league-logo.png`; 
  };

  useEffect(() => {
    // ----------------------------------------------------------------
    // 1. [시간 계산 로직] (기존 유지)
    // ----------------------------------------------------------------
    const updateGameTime = () => {
      if (match.status === 'UPCOMING') {
        setElapsedTime(0);
        return;
      }
      if (match.status === 'FINISHED') {
        setElapsedTime(90); 
        return;
      }

      const now = new Date().getTime();
      const currentYear = new Date().getFullYear(); 

      const safeDateString = `${currentYear}. ${match.matchTime}`.replaceAll('.', '/'); 
      const start = new Date(safeDateString).getTime();
      
      const diffMs = now - start;
      let minutes = Math.floor(diffMs / (1000 * 60)); 

      // 하프타임 보정
      if (minutes > 45) {
        if (minutes <= 60) minutes = 45; 
        else minutes = minutes - 20; 
      }
      setElapsedTime(minutes < 0 ? 0 : minutes);
    };

    // ----------------------------------------------------------------
    // 2. ★ [수정됨] 서버 데이터 폴링 (Polling)
    // - 가짜 계산 대신, 5초마다 서버에 "지금 배당/점수 몇이야?"라고 물어봄
    // ----------------------------------------------------------------
    const fetchLatestData = async () => {
      try {
        // 캐시 방지를 위해 시간 파라미터(?t=...) 추가
        const res = await fetch(`${API_BASE_URL}/api/matches?t=${Date.now()}`);
        if (!res.ok) return;

        const allMatches = await res.json();
        // 현재 카드에 해당하는 경기만 찾음
        const myMatch = allMatches.find((m: any) => m.id === match.id);

        if (myMatch) {
          // 1. 배당률 업데이트 (트렌드 표시 로직 포함)
          setLiveOdds((prev) => {
            if (myMatch.odds.home > prev.home) setTrend('up');
            else if (myMatch.odds.home < prev.home) setTrend('down');
            else setTrend(null);
            return myMatch.odds;
          });

          // 2. 스코어 업데이트 (골 들어가면 자동 반영됨!)
          setLiveScore({
            home: myMatch.score?.home ?? 0,
            away: myMatch.score?.away ?? 0
          });
        }
      } catch (err) {
        console.error("실시간 데이터 동기화 실패:", err);
      }
    };

    // 초기 실행
    updateGameTime();
    // fetchLatestData(); // 필요 시 주석 해제 (초기 로딩은 props로 충분함)

    // ★ 주기적 실행
    const dataInterval = setInterval(fetchLatestData, 5000); // 5초마다 서버 데이터 동기화
    const timeInterval = setInterval(updateGameTime, 10000); // 10초마다 시간 갱신

    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, [match]);

  const handleBet = (type: 'home' | 'draw' | 'away', teamName: string) => {
    addBet({
      id: `${match.id}-${type}`,
      matchId: match.id,
      teamName,
      selectedType: type,
      odds: liveOdds[type], // 화면에 보이는 서버 배당으로 베팅
      status: match.status
    });
  };

  const isSelected = (type: 'home' | 'draw' | 'away') => 
    bets.some(b => b.matchId === match.id && b.selectedType === type);

  const getBtnClass = (type: 'home' | 'draw' | 'away') => `
    flex-1 py-4 rounded-xl transition-all relative overflow-hidden
    ${isSelected(type) 
      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]' 
      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600'}
  `;

  return (
    <div className="relative rounded-2xl overflow-hidden mb-6 group border border-slate-700/50">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>

      <div className="relative p-6">
        {/* 상단: 리그 정보 & 시간 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {match.status === 'LIVE' ? (
               <>
                 <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                 <span className="text-red-500 font-bold tracking-wider text-sm">LIVE MATCH</span>
               </>
            ) : (
               <span className="text-slate-400 font-bold tracking-wider text-sm">{match.status}</span>
            )}
          </div>
          <div className="bg-slate-950/50 px-3 py-1 rounded-full border border-slate-700/50 text-emerald-400 font-mono text-sm">
            {elapsedTime > 90 ? '90+' : `${elapsedTime}'`}
          </div>
        </div>

        {/* 메인: 스코어 보드 */}
        <div className="flex justify-between items-center mb-8">
          {/* 홈팀 */}
          <div className="flex flex-col items-center gap-3 flex-1">
             <div className="w-20 h-20 relative p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
              <img src={match.homeLogo || getTeamBadge(match.homeTeam)} alt={match.homeTeam} className="w-full h-full object-contain p-2" />
            </div>
            <span className="font-bold text-lg text-white text-center leading-tight">{match.homeTeam}</span>
          </div>

          {/* 중앙 점수 (★ state인 liveScore 사용) */}
          <div className="px-6 text-center relative">
            <div className="text-5xl font-black text-white font-mono tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {liveScore.home} : {liveScore.away}
            </div>
            <div className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Current Score</div>
          </div>

          {/* 원정팀 */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-20 h-20 relative p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
              <img src={match.awayLogo || getTeamBadge(match.awayTeam)} alt={match.awayTeam} className="w-full h-full object-contain p-2" />
            </div>
            <span className="font-bold text-lg text-white text-center leading-tight">{match.awayTeam}</span>
          </div>
        </div>

        {/* 하단: 배당 버튼 */}
        <div className="flex gap-3">
          <button onClick={() => handleBet('home', match.homeTeam)} className={getBtnClass('home')}>
            <div className="text-xs opacity-70 mb-1">HOME</div>
            <div className={`text-xl font-bold font-mono ${trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-blue-400' : 'text-white'}`}>
              {liveOdds.home.toFixed(2)}
            </div>
          </button>

          <button onClick={() => handleBet('draw', 'Draw')} className={getBtnClass('draw')}>
            <div className="text-xs opacity-70 mb-1">DRAW</div>
            <div className="text-xl font-bold font-mono text-white">
              {liveOdds.draw.toFixed(2)}
            </div>
          </button>

          <button onClick={() => handleBet('away', match.awayTeam)} className={getBtnClass('away')}>
            <div className="text-xs opacity-70 mb-1">AWAY</div>
            <div className="text-xl font-bold font-mono text-white">
              {liveOdds.away.toFixed(2)}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}