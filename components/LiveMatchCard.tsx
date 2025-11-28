'use client';

import { useState, useEffect } from 'react';
// import Image from 'next/image'; // 외부 로고 이슈 방지를 위해 일반 img 태그 사용 권장
import { useBetStore } from '../store/useBetStore';
import { calculateLiveOdds } from '@/utils/oddsSystem';

interface MatchProps {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  matchTime: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  odds: { home: number; draw: number; away: number };
  score?: { home: number; away: number };
}

export default function LiveMatchCard({ match }: { match: MatchProps }) {
  const { addBet, bets } = useBetStore();
  const [liveOdds, setLiveOdds] = useState(match.odds);
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // ★ [추가됨] 로고 찾는 함수 (MatchCard와 동일하게 적용)
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
    
    // 울버햄튼, 선덜랜드 등 추가된 버전
    if (lowerName.includes('wolves') || lowerName.includes('wolverhampton')) return `${baseUrl}/t39.svg`;
    if (lowerName.includes('leeds')) return `${baseUrl}/t2.svg`;      
    if (lowerName.includes('watford')) return `${baseUrl}/t57.svg`;
    if (lowerName.includes('norwich')) return `${baseUrl}/t45.svg`;
    if (lowerName.includes('sunderland')) return `${baseUrl}/t56.svg`;

    // 기본값: 프리미어리그 공용 로고
    return `https://assets.codepen.io/t-1/premier-league-logo.png`; 
  };

  useEffect(() => {
    setElapsedTime(Math.floor(Math.random() * 90));

    const oddsInterval = setInterval(() => {
      setLiveOdds((prev) => {
        const newOdds = calculateLiveOdds(match.odds, match.score?.home ?? 0, match.score?.away ?? 0);
        if (newOdds.home > prev.home) setTrend('up');
        else if (newOdds.home < prev.home) setTrend('down');
        else setTrend(null);
        return newOdds;
      });
    }, 2000); 

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => (prev < 90 ? prev + 1 : prev));
    }, 60000);

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
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-red-500 font-bold tracking-wider text-sm">LIVE MATCH</span>
          </div>
          <div className="bg-slate-950/50 px-3 py-1 rounded-full border border-slate-700/50 text-emerald-400 font-mono text-sm">
            {elapsedTime}'
          </div>
        </div>

        {/* 메인: 스코어 보드 */}
        <div className="flex justify-between items-center mb-8">
          {/* 홈팀 */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-20 h-20 relative p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
              {/* ★ [수정됨] Image -> img 태그 사용, getTeamBadge 적용 */}
              <img 
                src={match.homeLogo || getTeamBadge(match.homeTeam)} 
                alt={match.homeTeam} 
                className="w-full h-full object-contain p-2" 
              />
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
              {/* ★ [수정됨] Image -> img 태그 사용, getTeamBadge 적용 */}
              <img 
                src={match.awayLogo || getTeamBadge(match.awayTeam)} 
                alt={match.awayTeam} 
                className="w-full h-full object-contain p-2" 
              />
            </div>
            <span className="font-bold text-lg text-white text-center leading-tight">{match.awayTeam}</span>
          </div>
        </div>

        {/* 하단: 실시간 배당 버튼 */}
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