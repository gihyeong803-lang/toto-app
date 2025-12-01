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
  matchTime: string; // "12. 01. 23:05" (한국 시간 문자열)
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  odds: { home: number; draw: number; away: number };
  score?: { home: number; away: number };
}

export default function MatchCard({ match }: { match: MatchProps }) {
  const { addBet, bets } = useBetStore();
  
  // 상태 관리
  const [liveOdds, setLiveOdds] = useState(match.odds);
  const [liveScore, setLiveScore] = useState(match.score || { home: 0, away: 0 });
  const [currentStatus, setCurrentStatus] = useState(match.status);
  
  // ★ [추가됨] 베팅 잠금 상태 관리 (이게 있어야 막힙니다!)
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');

  // 로고 매핑 함수 (최신 버전 유지)
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
    // ★ [추가됨] 15분 전 / 라이브 상태 체크 -> 버튼 잠금 로직
    // ----------------------------------------------------------------
    const checkTimeAndStatus = () => {
      // 1. 경기 종료 -> 잠금
      if (currentStatus === 'FINISHED') {
        setIsLocked(true);
        setLockReason('경기 종료');
        return;
      }

      // 2. 이미 라이브 중 -> 일반 탭에서는 베팅 불가 -> 잠금
      if (currentStatus === 'LIVE') {
        setIsLocked(true);
        setLockReason('라이브 중 (이동)');
        return;
      }

      // 3. 시간 계산 ("12. 01. 23:05" 파싱)
      const now = new Date();
      const currentYear = now.getFullYear();
      const parts = match.matchTime.match(/\d+/g);
      
      if (parts && parts.length >= 4) {
        // 한국 시간 기준 Date 객체 생성
        const matchDate = new Date(
          currentYear, 
          parseInt(parts[0]) - 1, 
          parseInt(parts[1]), 
          parseInt(parts[2]), 
          parseInt(parts[3])
        );

        const diffMs = matchDate.getTime() - now.getTime();
        const minutesRemaining = Math.floor(diffMs / (1000 * 60));

        // ★ 15분 이하로 남았으면 잠금
        if (minutesRemaining <= 15) {
          setIsLocked(true);
          setLockReason('베팅 마감');
        } else {
          setIsLocked(false);
          setLockReason('');
        }
      }
    };

    // ----------------------------------------------------------------
    // 서버 데이터 폴링
    // ----------------------------------------------------------------
    const fetchLatestData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/matches?t=${Date.now()}`);
        if (!res.ok) return;

        const allMatches = await res.json();
        const myMatch = allMatches.find((m: any) => m.id === match.id);

        if (myMatch) {
          setLiveOdds(myMatch.odds);
          setLiveScore({
            home: myMatch.score?.home ?? 0,
            away: myMatch.score?.away ?? 0
          });
          
          let displayStatus = myMatch.status;
          if (['SCHEDULED', 'TIMED'].includes(myMatch.status)) displayStatus = 'UPCOMING';
          if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(myMatch.status)) displayStatus = 'LIVE';
          
          setCurrentStatus(displayStatus);
        }
      } catch (err) {
        console.error("동기화 실패");
      }
    };

    // 초기 체크
    checkTimeAndStatus();

    // 주기적 실행 (5초마다)
    const interval = setInterval(() => {
      fetchLatestData();
      checkTimeAndStatus(); // ★ 시간 체크도 계속 수행해야 함
    }, 5000);

    return () => clearInterval(interval);
  }, [match.id, match.matchTime, currentStatus]);


  // ----------------------------------------------------------------
  // UI 렌더링
  // ----------------------------------------------------------------
  const handleBet = (selection: 'home' | 'draw' | 'away', odds: number, label: string) => {
    // ★ 잠금 상태면 클릭 차단
    if (isLocked) {
      alert(`[${lockReason}] 현재 베팅할 수 없습니다. 라이브 베팅을 이용해주세요.`);
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

  // 버튼 컴포넌트
  const BettingButton = ({ selection, odds, label }: any) => (
    <button 
      onClick={() => handleBet(selection, odds, label)}
      disabled={isLocked} // ★ HTML 버튼 자체를 비활성화
      className={`flex-1 flex flex-col items-center justify-center py-4 rounded-lg border transition-all active:scale-95
        ${isSelected(selection) 
          ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'bg-[#23263a] text-slate-300 border-transparent hover:bg-[#2f334d]'}
        
        {/* ★ 잠금 상태일 때 스타일 변경 (회색 + 클릭불가 커서) */}
        ${isLocked ? 'opacity-40 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500' : ''} 
      `}
    >
      <span className="text-xs opacity-70 mb-1">{label}</span>
      
      {/* ★ 잠금 상태면 '이유' 표시, 아니면 '배당률' 표시 */}
      {isLocked ? (
        <span className="text-xs font-bold text-red-400">{lockReason}</span>
      ) : (
        <span className="font-bold font-mono text-lg">{odds.toFixed(2)}</span>
      )}
    </button>
  );

  return (
    <div className="bg-[#1e2130] rounded-xl overflow-hidden mb-4 border border-slate-700/50 shadow-xl">
      {/* (상단 디자인 코드는 기존과 동일하므로 생략하지 않고 전체 포함) */}
      <div className="px-5 py-3 flex justify-between items-center bg-[#23263a] border-b border-slate-700/50">
        <div className="flex items-center gap-2">
           <div className={`w-1 h-3 rounded-full ${currentStatus === 'LIVE' ? 'bg-red-500' : 'bg-emerald-400'}`}></div>
           <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Premier League</span>
        </div>
        <div className="text-slate-400 text-xs font-mono">
           {currentStatus === 'LIVE' && <span className="text-red-500 animate-pulse font-bold mr-2">● LIVE</span>}
           {match.matchTime}
        </div>
      </div>

      <div className="p-6 flex items-center justify-between relative">
        <div className="flex flex-col items-center gap-4 w-1/3">
          <div className="w-12 h-12 md:w-20 md:h-20 relative drop-shadow-2xl transition-transform hover:scale-110">
            <img src={match.homeLogo || getTeamBadge(match.homeTeam)} alt={match.homeTeam} className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-bold text-[10px] md:text-sm text-center leading-tight break-words w-full px-1">{match.homeTeam}</span>
        </div>

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

        <div className="flex flex-col items-center gap-4 w-1/3">
          <div className="w-12 h-12 md:w-20 md:h-20 relative drop-shadow-2xl transition-transform hover:scale-110">
             <img src={match.awayLogo || getTeamBadge(match.awayTeam)} alt={match.awayTeam} className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-bold text-sm text-[10px] md:text-sm text-center leading-tight break-words w-full px-1">{match.awayTeam}</span>
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