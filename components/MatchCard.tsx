'use client';

import { useState, useEffect } from 'react';
import { useBetStore } from '../store/useBetStore';

// ★ [삭제] 가짜 계산기 제거
// import { calculateLiveOdds } from '@/utils/oddsSystem';

// ★ [추가] 내 Render 서버 주소 (footballApi.ts와 동일)
const API_BASE_URL = 'https://toto-server-f4j2.onrender.com'; 

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
  
  // 1. 상태 관리 (서버 데이터와 동기화)
  const [liveOdds, setLiveOdds] = useState(match.odds);
  const [liveScore, setLiveScore] = useState(match.score || { home: 0, away: 0 });
  const [currentStatus, setCurrentStatus] = useState(match.status);

  // 2. [업그레이드] 25/26 시즌 고화질 로고 매핑 함수
  const getTeamBadge = (name: string) => {
    const lowerName = name?.toLowerCase() || '';

    // 1. 챔피언십 및 승격 유력 팀 (ESPN 고화질)
    if (lowerName.includes('sunderland')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/366.png';
    if (lowerName.includes('leeds')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/357.png';
    if (lowerName.includes('leicester')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/375.png';
    if (lowerName.includes('southampton')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/376.png';
    if (lowerName.includes('watford')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/395.png';
    if (lowerName.includes('norwich')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/381.png';
    
    // 2. 프리미어리그 현역 (Wiki SVG)
    if (lowerName.includes('arsenal')) return 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg';
    if (lowerName.includes('aston villa') || lowerName.includes('villa')) return 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg';
    if (lowerName.includes('bournemouth')) return 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg';
    if (lowerName.includes('brentford')) return 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg';
    if (lowerName.includes('brighton')) return 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg';
    if (lowerName.includes('chelsea')) return 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg';
    if (lowerName.includes('palace')) return 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg';
    if (lowerName.includes('everton')) return 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg';
    if (lowerName.includes('fulham')) return 'https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg';
    if (lowerName.includes('ipswich')) return 'https://upload.wikimedia.org/wikipedia/en/8/82/Ipswich_Town_FC_logo.svg';
    if (lowerName.includes('liverpool')) return 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg';
    if (lowerName.includes('city')) return 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'; 
    if (lowerName.includes('man utd') || lowerName.includes('united')) return 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg'; 
    if (lowerName.includes('newcastle')) return 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg';
    if (lowerName.includes('nottingham') || lowerName.includes('forest')) return 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg';
    if (lowerName.includes('tottenham') || lowerName.includes('spurs')) return 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg';
    if (lowerName.includes('west ham')) return 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg';
    if (lowerName.includes('wolves') || lowerName.includes('wolverhampton')) return 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg';

    return `https://assets.codepen.io/t-1/premier-league-logo.png`; 
  };

  useEffect(() => {
    // ----------------------------------------------------------------
    // ★ [수정됨] 서버 데이터 폴링 (가짜 계산 대신 실제 데이터 가져오기)
    // ----------------------------------------------------------------
    const fetchLatestData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/matches?t=${Date.now()}`);
        if (!res.ok) return;

        const allMatches = await res.json();
        const myMatch = allMatches.find((m: any) => m.id === match.id);

        if (myMatch) {
          // 서버 데이터로 상태 업데이트
          setLiveOdds(myMatch.odds);
          setLiveScore({
            home: myMatch.score?.home ?? 0,
            away: myMatch.score?.away ?? 0
          });
          
          // 상태값 변환 (백엔드 -> 프론트)
          let displayStatus = myMatch.status;
          if (['SCHEDULED', 'TIMED'].includes(myMatch.status)) displayStatus = 'UPCOMING';
          if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(myMatch.status)) displayStatus = 'LIVE';
          
          setCurrentStatus(displayStatus);
        }
      } catch (err) {
        console.error("데이터 동기화 실패");
      }
    };

    // 라이브 경기면 5초마다, 아니면 15초마다 갱신 (서버 부하 조절)
    const intervalTime = currentStatus === 'LIVE' ? 5000 : 15000;
    const interval = setInterval(fetchLatestData, intervalTime);

    return () => clearInterval(interval);
  }, [match.id, currentStatus]);

  const isBettingAllowed = currentStatus !== 'FINISHED';

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
      status: currentStatus as any
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
           {currentStatus === 'LIVE' && <span className="text-red-500 animate-pulse font-bold mr-2">● LIVE</span>}
           {match.matchTime}
        </div>
      </div>

      <div className="p-6 flex items-center justify-between relative">
        
        {/* Home Team */}
        <div className="flex flex-col items-center gap-4 w-1/3">
          <div className="w-12 h-12 md:w-20 md:h-20 relative drop-shadow-2xl transition-transform hover:scale-110">
            <img 
              src={match.homeLogo || getTeamBadge(match.homeTeam)} 
              alt={match.homeTeam} 
              className="w-full h-full object-contain" 
            />
          </div>
          <span className="text-white font-bold text-[10px] md:text-sm text-center leading-tight break-words w-full px-1">
            {match.homeTeam}
          </span>
        </div>

        {/* VS / Score */}
        <div className="flex flex-col items-center justify-center w-1/3">
          {currentStatus === 'UPCOMING' ? (
             <span className="text-2xl md:text-3xl font-black text-slate-600 italic opacity-50">VS</span>
          ) : (
             <div className="flex gap-3 items-center">
               <span className="text-2xl md:text-4xl font-bold text-white">{liveScore.home}</span>
               <span className="text-slate-600 text-xl md:text-2xl">:</span>
               <span className="text-2xl md:text-4xl font-bold text-white">{liveScore.away}</span>
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