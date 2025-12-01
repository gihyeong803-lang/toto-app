'use client';

import { useState, useEffect } from 'react';
import { useBetStore } from '../store/useBetStore';

// 내 Render 서버 주소
const API_BASE_URL = 'https://toto-server-f4j2.onrender.com'; 

interface MatchProps {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  matchTime: string; // "11. 30. 23:05"
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  odds: { home: number; draw: number; away: number };
  score?: { home: number; away: number };
}

export default function LiveMatchCard({ match }: { match: MatchProps }) {
  const { addBet, bets } = useBetStore();
  
  // 상태 관리
  const [liveOdds, setLiveOdds] = useState(match.odds);
  const [liveScore, setLiveScore] = useState(match.score || { home: 0, away: 0 });
  // ★ [추가] 실시간 상태 동기화 (경기가 끝나면 화면도 끝나야 함)
  const [currentStatus, setCurrentStatus] = useState(match.status);
  
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 로고 매핑 함수 (최신 유지)
  const getTeamBadge = (name: string) => {
    const lowerName = name?.toLowerCase() || '';

    if (lowerName.includes('newcastle')) return 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg';
    if (lowerName.includes('west ham')) return 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg';
    if (lowerName.includes('sheffield')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/398.png';
    if (lowerName.includes('leeds')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/357.png';
    
    if (lowerName.includes('man city') || lowerName.includes('city')) return 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg';
    if (lowerName.includes('man utd') || lowerName.includes('manchester united')) return 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg';

    if (lowerName.includes('arsenal')) return 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg';
    if (lowerName.includes('aston') || lowerName.includes('villa')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/362.png';
    if (lowerName.includes('bournemouth')) return 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg';
    if (lowerName.includes('brentford')) return 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg';
    if (lowerName.includes('brighton')) return 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg';
    if (lowerName.includes('chelsea')) return 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg';
    if (lowerName.includes('palace')) return 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg';
    if (lowerName.includes('everton')) return 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg';
    if (lowerName.includes('fulham')) return 'https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg';
    if (lowerName.includes('ipswich')) return 'https://upload.wikimedia.org/wikipedia/en/8/82/Ipswich_Town_FC_logo.svg';
    if (lowerName.includes('leicester')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/375.png';
    if (lowerName.includes('liverpool')) return 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg';
    if (lowerName.includes('luton')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/301.png';
    if (lowerName.includes('forest') || lowerName.includes('nottingham')) return 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg';
    if (lowerName.includes('southampton')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/376.png';
    if (lowerName.includes('tottenham') || lowerName.includes('spurs')) return 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg';
    if (lowerName.includes('wolves') || lowerName.includes('wolverhampton')) return 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg';
    
    if (lowerName.includes('sunderland')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/366.png';
    if (lowerName.includes('watford')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/395.png';
    if (lowerName.includes('norwich')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/381.png';
    if (lowerName.includes('west brom')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/383.png';
    if (lowerName.includes('stoke')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/336.png';
    if (lowerName.includes('hull')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/306.png';
    if (lowerName.includes('middlesbrough')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/369.png';
    if (lowerName.includes('blackburn')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/365.png';
    if (lowerName.includes('burnley')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/379.png';

    return 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg';
  };

  useEffect(() => {
    // ----------------------------------------------------------------
    // 1. [시간 계산 로직] currentStatus 사용하도록 변경
    // ----------------------------------------------------------------
    const updateGameTime = () => {
      // ★ [수정] match.status 대신 실시간으로 변하는 currentStatus 사용
      if (currentStatus === 'UPCOMING') {
        setElapsedTime(0);
        return;
      }
      if (currentStatus === 'FINISHED') {
        setElapsedTime(90); 
        return;
      }

      const now = new Date().getTime();
      const currentYear = new Date().getFullYear(); 

      const safeDateString = `${currentYear}. ${match.matchTime}`.replaceAll('.', '/'); 
      const start = new Date(safeDateString).getTime();
      
      const diffMs = now - start;
      let minutes = Math.floor(diffMs / (1000 * 60)); 

      if (minutes > 45) {
        if (minutes <= 60) minutes = 45; 
        else minutes = minutes - 20; 
      }
      setElapsedTime(minutes < 0 ? 0 : minutes);
    };

    // ----------------------------------------------------------------
    // 2. [서버 데이터 폴링] 상태(status) 업데이트 추가
    // ----------------------------------------------------------------
    const fetchLatestData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/matches?t=${Date.now()}`);
        if (!res.ok) return;

        const allMatches = await res.json();
        const myMatch = allMatches.find((m: any) => m.id === match.id);

        if (myMatch) {
          // 배당 & 스코어 업데이트
          setLiveOdds((prev) => {
            if (myMatch.odds.home > prev.home) setTrend('up');
            else if (myMatch.odds.home < prev.home) setTrend('down');
            else setTrend(null);
            return myMatch.odds;
          });

          setLiveScore({
            home: myMatch.score?.home ?? 0,
            away: myMatch.score?.away ?? 0
          });

          // ★ [핵심 추가] 경기 상태도 업데이트해야 끝났을 때 알 수 있음
          let displayStatus = myMatch.status;
          if (['SCHEDULED', 'TIMED'].includes(myMatch.status)) displayStatus = 'UPCOMING';
          if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(myMatch.status)) displayStatus = 'LIVE';
          
          setCurrentStatus(displayStatus); // 상태 동기화
        }
      } catch (err) {
        console.error("실시간 데이터 동기화 실패:", err);
      }
    };

    updateGameTime();

    const dataInterval = setInterval(fetchLatestData, 5000); 
    const timeInterval = setInterval(updateGameTime, 10000); 

    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, [match, currentStatus]); // ★ 의존성에 currentStatus 추가

  // ----------------------------------------------------------------
  // UI 렌더링
  // ----------------------------------------------------------------
  
  // ★ 경기가 끝났는지 체크
  const isBettingAllowed = currentStatus !== 'FINISHED';

  const handleBet = (type: 'home' | 'draw' | 'away', teamName: string) => {
    if (!isBettingAllowed) {
      alert("경기가 종료되었습니다.");
      return;
    }
    
    addBet({
      id: `${match.id}-${type}`,
      matchId: match.id,
      teamName,
      selectedType: type,
      odds: liveOdds[type], 
      status: currentStatus as any // ★ 현재 상태로 저장
    });
  };

  const isSelected = (type: 'home' | 'draw' | 'away') => 
    bets.some(b => b.matchId === match.id && b.selectedType === type);

  const getBtnClass = (type: 'home' | 'draw' | 'away') => `
    flex-1 py-4 rounded-xl transition-all relative overflow-hidden
    ${isSelected(type) 
      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]' 
      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600'}
    ${!isBettingAllowed ? 'opacity-50 cursor-not-allowed grayscale' : ''} // ★ 종료 시 스타일 처리
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
            {currentStatus === 'LIVE' ? ( // ★ currentStatus 사용
               <>
                 <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                 <span className="text-red-500 font-bold tracking-wider text-sm">LIVE MATCH</span>
               </>
            ) : (
               <span className="text-slate-400 font-bold tracking-wider text-sm">{currentStatus}</span>
            )}
          </div>
          <div className="bg-slate-950/50 px-3 py-1 rounded-full border border-slate-700/50 text-emerald-400 font-mono text-sm">
            {elapsedTime > 90 ? '90+' : `${elapsedTime}'`}
          </div>
        </div>

        {/* 메인: 스코어 보드 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col items-center gap-3 flex-1">
             <div className="w-20 h-20 relative p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
              <img src={match.homeLogo || getTeamBadge(match.homeTeam)} alt={match.homeTeam} className="w-full h-full object-contain p-2" />
            </div>
            <span className="font-bold text-lg text-white text-center leading-tight">{match.homeTeam}</span>
          </div>

          <div className="px-6 text-center relative">
            <div className="text-5xl font-black text-white font-mono tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {liveScore.home} : {liveScore.away}
            </div>
            <div className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Current Score</div>
          </div>

          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-20 h-20 relative p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
              <img src={match.awayLogo || getTeamBadge(match.awayTeam)} alt={match.awayTeam} className="w-full h-full object-contain p-2" />
            </div>
            <span className="font-bold text-lg text-white text-center leading-tight">{match.awayTeam}</span>
          </div>
        </div>

        {/* 하단: 배당 버튼 */}
        <div className="flex gap-3">
          <button 
            onClick={() => handleBet('home', match.homeTeam)} 
            disabled={!isBettingAllowed} // ★ 종료 시 비활성화
            className={getBtnClass('home')}
          >
            <div className="text-xs opacity-70 mb-1">HOME</div>
            <div className={`text-xl font-bold font-mono ${trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-blue-400' : 'text-white'}`}>
              {liveOdds.home.toFixed(2)}
            </div>
          </button>

          <button 
            onClick={() => handleBet('draw', 'Draw')} 
            disabled={!isBettingAllowed}
            className={getBtnClass('draw')}
          >
            <div className="text-xs opacity-70 mb-1">DRAW</div>
            <div className="text-xl font-bold font-mono text-white">
              {liveOdds.draw.toFixed(2)}
            </div>
          </button>

          <button 
            onClick={() => handleBet('away', match.awayTeam)} 
            disabled={!isBettingAllowed}
            className={getBtnClass('away')}
          >
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