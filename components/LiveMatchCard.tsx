'use client';

import { useState, useEffect } from 'react';
// import Image from 'next/image'; 
import { useBetStore } from '../store/useBetStore';
import { calculateLiveOdds } from '@/utils/oddsSystem';

interface MatchProps {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  matchTime: string; // 예: "11. 30. 23:05" (서버에서 계산된 한국 시간 문자열)
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  odds: { home: number; draw: number; away: number };
  score?: { home: number; away: number };
}

export default function LiveMatchCard({ match }: { match: MatchProps }) {
  const { addBet, bets } = useBetStore();
  
  // 초기 상태 설정
  const [liveOdds, setLiveOdds] = useState(match.odds);
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 로고 매핑 함수 (UpcomingPage와 동일한 로직)
  const getTeamBadge = (name: string) => {
    const lowerName = name?.toLowerCase() || '';
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
    if (lowerName.includes('leeds')) return `${baseUrl}/t2.svg`;      
    if (lowerName.includes('watford')) return `${baseUrl}/t57.svg`;
    if (lowerName.includes('norwich')) return `${baseUrl}/t45.svg`;
    if (lowerName.includes('sunderland')) return `${baseUrl}/t56.svg`;

    return `https://assets.codepen.io/t-1/premier-league-logo.png`; 
  };

  useEffect(() => {
    // ----------------------------------------------------------------
    // 1. [시간 계산 로직] 서버에서 온 한국 시간 문자열을 파싱 + 하프타임 보정
    // ----------------------------------------------------------------
    const updateGameTime = () => {
      // 경기 전이면 0분
      if (match.status === 'UPCOMING') {
        setElapsedTime(0);
        return;
      }
      
      // 경기 종료면 90분 고정
      if (match.status === 'FINISHED') {
        setElapsedTime(90); 
        return;
      }

      const now = new Date().getTime();
      const currentYear = new Date().getFullYear(); // 2025

      // 서버에서 온 match.matchTime은 "11. 30. 23:05" (한국 시간 숫자)
      // 여기에 연도를 붙여서 "2025. 11. 30. 23:05" 형태로 만듦
      const safeDateString = `${currentYear}. ${match.matchTime}`.replaceAll('.', '/'); 
      const start = new Date(safeDateString).getTime();
      
      const diffMs = now - start;
      let minutes = Math.floor(diffMs / (1000 * 60)); // 물리적으로 흐른 전체 분

      // ★ [핵심] 하프타임(HT) 보정 로직
      // 물리적 시간이 45분을 넘어가면 하프타임(15분) 및 추가시간을 고려해 보정
      if (minutes > 45) {
        // 전반전 종료 후 ~ 후반 시작 전 (약 15분간) -> 45분으로 고정 표시
        if (minutes <= 60) {
           minutes = 45; 
        } 
        // 후반전 (60분 이후) -> 하프타임(15분) + 추가시간(약 5분) = 총 20분 차감하여 실제 경기 시간과 맞춤
        else {
           minutes = minutes - 20; 
        }
      }

      // 음수 방지
      setElapsedTime(minutes < 0 ? 0 : minutes);
    };

    // ----------------------------------------------------------------
    // 2. [배당률 업데이트] 초기 로딩 갭(Gap) 제거
    // ----------------------------------------------------------------
    const updateOdds = () => {
      setLiveOdds((prev) => {
        // 서버의 스코어를 안전하게 가져옴
        const homeScore = match.score?.home ?? 0;
        const awayScore = match.score?.away ?? 0;

        const newOdds = calculateLiveOdds(match.odds, homeScore, awayScore);
        
        if (newOdds.home > prev.home) setTrend('up');
        else if (newOdds.home < prev.home) setTrend('down');
        else setTrend(null);
        
        return newOdds;
      });
    };

    // ★ 초기화 시점: 즉시 실행 (시간 계산 및 배당 표시)
    updateOdds();
    updateGameTime();

    // ★ 주기적 실행
    const oddsInterval = setInterval(updateOdds, 2000); // 배당은 2초마다
    const timeInterval = setInterval(updateGameTime, 10000); // 시간은 10초마다 갱신

    return () => {
      clearInterval(oddsInterval);
      clearInterval(timeInterval);
    };
  }, [match]);

  const handleBet = (type: 'home' | 'draw' | 'away', teamName: string) => {
    addBet({
      id: `${match.id}-${type}`,
      matchId: match.id,
      teamName,
      selectedType: type,
      odds: liveOdds[type],
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
            {/* 90분 넘어가면 90+로 표시, 아니면 계산된 시간(보정됨) 표시 */}
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

          {/* 중앙 점수 */}
          <div className="px-6 text-center relative">
            <div className="text-5xl font-black text-white font-mono tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {match.score?.home ?? 0} : {match.score?.away ?? 0}
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