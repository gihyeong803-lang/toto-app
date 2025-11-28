'use client';

import { useState, useEffect } from 'react';
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

export default function MatchCard({ match }: { match: MatchProps }) {
  const { addBet, bets } = useBetStore();
  const [liveOdds, setLiveOdds] = useState(match.odds);

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
    if (lowerName.includes('wolves')) return `${baseUrl}/t39.svg`;
    
    if (lowerName.includes('leeds')) return `${baseUrl}/t2.svg`;      
    if (lowerName.includes('watford')) return `${baseUrl}/t57.svg`;
    if (lowerName.includes('norwich')) return `${baseUrl}/t45.svg`;
    if (lowerName.includes('sunderland')) return `${baseUrl}/t56.svg`;

    return `https://assets.codepen.io/t-1/premier-league-logo.png`; 
  };

  useEffect(() => {
    if (match.status === 'LIVE') {
      const interval = setInterval(() => {
        setLiveOdds((prevOdds) => {
          const h = match.score?.home ?? 0;
          const a = match.score?.away ?? 0;
          return calculateLiveOdds(match.odds, h, a);
        });
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setLiveOdds(match.odds);
    }
  }, [match.status, match.score, match.odds]);

  const isBettingAllowed = match.status !== 'FINISHED';

  const handleBet = (selection: 'home' | 'draw' | 'away', odds: number, label: string) => {
    if (!isBettingAllowed) {
      alert("종료된 경기는 베팅할 수 없습니다.");
      return;
    }
    addBet({
      id: `${match.id}-${selection}`,
      matchId: match.id,
      teamName: label,
      selectedType: selection,
      odds: odds,
      status: match.status
    });
  };

  const isSelected = (selection: string) => bets.some(b => b.id === `${match.id}-${selection}`);

  const BettingButton = ({ selection, odds, label }: any) => (
    <button 
      onClick={() => handleBet(selection, odds, label)}
      className={`flex-1 flex flex-col items-center justify-center py-4 rounded-lg border transition-all active:scale-95
        ${isSelected(selection) 
          ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'bg-[#23263a] text-slate-300 border-transparent hover:bg-[#2f334d]'}
        ${!isBettingAllowed ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span className="text-xs opacity-70 mb-1">{label}</span>
      <span className="font-bold font-mono text-lg">{odds.toFixed(2)}</span>
    </button>
  );

  return (
    <div className="bg-[#1e2130] rounded-xl overflow-hidden mb-4 border border-slate-700/50 shadow-xl">
      
      <div className="px-5 py-3 flex justify-between items-center bg-[#23263a] border-b border-slate-700/50">
        <div className="flex items-center gap-2">
           <div className="w-1 h-3 bg-emerald-400 rounded-full"></div>
           <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Premier League</span>
        </div>
        <div className="text-slate-400 text-xs font-mono">
           {match.status === 'LIVE' && <span className="text-red-500 animate-pulse font-bold mr-2">● LIVE</span>}
           {match.matchTime}
        </div>
      </div>

      <div className="p-6 flex items-center justify-between relative">
        
        {/* Home Team */}
        <div className="flex flex-col items-center gap-4 w-1/3">
          {/* ★ [수정됨] 모바일에서 로고 크기 작게(w-12), PC에선 원래대로(md:w-20) */}
          <div className="w-12 h-12 md:w-20 md:h-20 relative drop-shadow-2xl transition-transform hover:scale-110">
            <img 
              src={match.homeLogo || getTeamBadge(match.homeTeam)} 
              alt={match.homeTeam} 
              className="w-full h-full object-contain" 
            />
          </div>
          {/* ★ [수정됨] 모바일에서 글자 작게(text-[10px]), 줄바꿈 허용(break-words) */}
          <span className="text-white font-bold text-[10px] md:text-sm text-center leading-tight break-words w-full px-1">
            {match.homeTeam}
          </span>
        </div>

        {/* VS / Score */}
        <div className="flex flex-col items-center justify-center w-1/3">
          {match.status === 'UPCOMING' ? (
             <span className="text-2xl md:text-3xl font-black text-slate-600 italic opacity-50">VS</span>
          ) : (
             <div className="flex gap-3 items-center">
               <span className="text-2xl md:text-4xl font-bold text-white">{match.score?.home}</span>
               <span className="text-slate-600 text-xl md:text-2xl">:</span>
               <span className="text-2xl md:text-4xl font-bold text-white">{match.score?.away}</span>
             </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-4 w-1/3">
          <div className="w-12 h-12 md:w-20 md:h-20 relative drop-shadow-2xl transition-transform hover:scale-110">
             <img 
              src={match.awayLogo || getTeamBadge(match.awayTeam)} 
              alt={match.awayTeam} 
              className="w-full h-full object-contain" 
            />
          </div>
          <span className="text-white font-bold text-sm text-[10px] md:text-sm text-center leading-tight break-words w-full px-1">
            {match.awayTeam}
          </span>
        </div>
      </div>

      <div className="p-4 pt-0 flex gap-3">
        <BettingButton selection="home" odds={liveOdds.home} label="승 (Home)" />
        <BettingButton selection="draw" odds={liveOdds.draw} label="무 (Draw)" />
        <BettingButton selection="away" odds={liveOdds.away} label="패 (Away)" />
      </div>
    </div>
  );
}