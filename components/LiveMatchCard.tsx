'use client';

import { useState, useEffect } from 'react';
import { useBetStore } from '../store/useBetStore';

interface MatchProps {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  date?: string; 
  time?: string;
  matchTime?: string; 
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  odds: { home: number; draw: number; away: number };
  score?: { home: number; away: number };
}

export default function LiveMatchCard({ match }: { match: MatchProps }) {
  const { addBet, bets } = useBetStore();
  const [liveOdds, setLiveOdds] = useState(match.odds);
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);
  
  const [displayTime, setDisplayTime] = useState<string>("Loading...");

  const getTeamBadge = (name: string) => {
    const lowerName = name?.toLowerCase() || '';
    const baseUrl = 'https://resources.premierleague.com/premierleague/badges';

    if (lowerName.includes('sunderland')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/366.png';
    if (lowerName.includes('bournemouth')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/349.png';
    if (lowerName.includes('brentford')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/337.png';
    if (lowerName.includes('burnley')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/379.png';
    if (lowerName.includes('leeds')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/357.png';
    if (lowerName.includes('leicester')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/375.png';
    if (lowerName.includes('southampton')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/376.png';
    if (lowerName.includes('watford')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/395.png';
    if (lowerName.includes('norwich')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/381.png';
    if (lowerName.includes('west brom')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/383.png';
    if (lowerName.includes('stoke')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/336.png';
    if (lowerName.includes('hull')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/306.png';
    if (lowerName.includes('middlesbrough')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/369.png';
    if (lowerName.includes('blackburn')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/365.png';

    if (lowerName.includes('arsenal')) return `${baseUrl}/t3.svg`;
    if (lowerName.includes('villa')) return `${baseUrl}/t7.svg`;
    if (lowerName.includes('brighton')) return `${baseUrl}/t36.svg`;
    if (lowerName.includes('chelsea')) return `${baseUrl}/t8.svg`;
    if (lowerName.includes('palace')) return `${baseUrl}/t31.svg`;
    if (lowerName.includes('everton')) return `${baseUrl}/t11.svg`;
    if (lowerName.includes('fulham')) return `${baseUrl}/t54.svg`;
    if (lowerName.includes('ipswich')) return `${baseUrl}/t40.svg`;
    if (lowerName.includes('liverpool')) return `${baseUrl}/t14.svg`;
    if (lowerName.includes('luton')) return `${baseUrl}/t102.svg`;
    if (lowerName.includes('city')) return `${baseUrl}/t43.svg`;
    if (lowerName.includes('man utd') || lowerName.includes('united')) return `${baseUrl}/t1.svg`;
    if (lowerName.includes('newcastle')) return `${baseUrl}/t4.svg`;
    if (lowerName.includes('forest') || lowerName.includes('nottingham')) return `${baseUrl}/t17.svg`;
    if (lowerName.includes('sheffield')) return `${baseUrl}/t49.svg`;
    if (lowerName.includes('tottenham') || lowerName.includes('spurs')) return `${baseUrl}/t6.svg`;
    if (lowerName.includes('west ham')) return `${baseUrl}/t21.svg`;
    if (lowerName.includes('wolves') || lowerName.includes('wolverhampton')) return `${baseUrl}/t39.svg`;

    return `https://assets.codepen.io/t-1/premier-league-logo.png`; 
  };

  const calculateRealTimeOdds = (currentOdds: { home: number, draw: number, away: number }, homeScore: number, awayScore: number, minute: number) => {
    let { home, draw, away } = currentOdds;
    const scoreDiff = homeScore - awayScore;
    const timeFactor = 1 + (minute / 45); 

    if (scoreDiff > 0) {
        home = Math.max(1.01, home * (1 - (0.1 * scoreDiff * timeFactor))); 
        draw = draw * (1 + (0.3 * scoreDiff * timeFactor));
        away = away * (1 + (0.8 * scoreDiff * timeFactor));
    } else if (scoreDiff < 0) {
        home = home * (1 + (0.8 * Math.abs(scoreDiff) * timeFactor)); 
        draw = draw * (1 + (0.3 * Math.abs(scoreDiff) * timeFactor));
        away = Math.max(1.01, away * (1 - (0.1 * Math.abs(scoreDiff) * timeFactor)));
    } else {
        draw = Math.max(1.01, draw * 0.98);
        home = home * 1.02;
        away = away * 1.02;
    }
    return {
        home: parseFloat(home.toFixed(2)),
        draw: parseFloat(draw.toFixed(2)),
        away: parseFloat(away.toFixed(2))
    };
  };

  useEffect(() => {
    const calculateTime = () => {
        let timeString = match.matchTime;
        if (!timeString && match.date && match.time) {
            timeString = `${match.date} ${match.time}`;
        }
        
        if (!timeString) {
            setDisplayTime("0'");
            return;
        }

        // 1. 날짜 파싱
        let startTime = new Date(timeString.includes('T') ? timeString : `${timeString} UTC`).getTime();
        
        // 2. 연도 오류 보정 (1970년 등으로 인식될 경우)
        const startObj = new Date(startTime);
        if (startObj.getFullYear() < 2024) {
            const nowYear = new Date().getFullYear();
            startObj.setFullYear(nowYear);
            startTime = startObj.getTime();
        }

        const now = new Date().getTime();
        let diffMs = now - startTime;

        // ★ [스마트 타임존 보정]
        // LIVE 상태인데 시간이 이상하면 강제로 보정합니다.
        if (match.status === 'LIVE') {
             // Case 1: 시간이 음수(미래)로 나와서 "경기 전"으로 뜨는 경우
             // -> 한국 시간(+9h)으로 인식된 것이므로 9시간을 더해줘서 보정
             if (diffMs < -1000) { 
                 diffMs += 9 * 60 * 60 * 1000;
             }
             // Case 2: 시간이 120분을 넘어 "90+"로 뜨는 경우
             // -> UTC(+0h)로 인식된 것이므로 9시간을 빼줘서 보정
             else if (diffMs > 3 * 60 * 60 * 1000) { // 3시간(180분) 이상 지났다고 뜨면
                 diffMs -= 9 * 60 * 60 * 1000;
             }
        } else {
            // LIVE가 아닐 때는 기존 방식 유지
            if (diffMs > 32400000) diffMs -= 9 * 60 * 60 * 1000;
            if (diffMs < -32400000) diffMs += 9 * 60 * 60 * 1000;
        }

        const diffMins = Math.floor(diffMs / (1000 * 60));

        // 3. 최종 표시
        if (diffMins < 0) {
            setDisplayTime("경기 전");
        } else if (diffMins <= 45) {
            setDisplayTime(`${diffMins}'`);
        } else if (diffMins > 45 && diffMins < 60) {
            setDisplayTime("HT");
        } else if (diffMins >= 60 && diffMins <= 105) {
            const actualTime = diffMins - 15; 
            setDisplayTime(`${actualTime}'`);
        } else {
            if (match.status === 'LIVE') setDisplayTime("90+'");
            else setDisplayTime("FT");
        }
    };

    calculateTime();
    const timeInterval = setInterval(calculateTime, 10000);

    const oddsInterval = setInterval(() => {
      setLiveOdds((prev) => {
        const minute = parseInt(displayTime.replace("'", "")) || 0;
        const calculated = calculateRealTimeOdds(match.odds, match.score?.home ?? 0, match.score?.away ?? 0, minute);
        
        if (calculated.home > prev.home) setTrend('up');
        else if (calculated.home < prev.home) setTrend('down');
        else setTrend(null);
        
        return calculated;
      });
    }, 5000);

    return () => {
      clearInterval(oddsInterval);
      clearInterval(timeInterval);
    };
  }, [match, displayTime]);

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
            {displayTime}
          </div>
        </div>

        {/* 메인: 스코어 보드 */}
        <div className="flex justify-between items-center mb-8">
          {/* 홈팀 */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-20 h-20 relative p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
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