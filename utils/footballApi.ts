// src/utils/footballApi.ts

// 내 Render 서버 주소
const API_BASE_URL = 'https://toto-server-f4j2.onrender.com'; 

export interface MatchData {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string; 
  awayLogo: string; 
  matchTime: string;
  status: string;
  score: { home: number; away: number };
  odds: { home: number; draw: number; away: number };
}

// ★ [핵심 변경] 25/26 시즌 대비 최신 로고 매핑 (ESPN + 위키피디아 소스 사용)
// 로고 매핑 함수 (수정버전)
  const getTeamBadge = (name: string) => {
    const lowerName = name?.toLowerCase() || '';

    // 1. 'United'가 들어가는 팀들 (맨유보다 먼저 검사해야 함!)
    if (lowerName.includes('newcastle')) return 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg';
    if (lowerName.includes('west ham')) return 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg';
    if (lowerName.includes('sheffield')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/398.png';
    if (lowerName.includes('leeds')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/357.png';
    
    // 2. 맨체스터 팀들 (순서 중요)
    if (lowerName.includes('man city') || lowerName.includes('city')) return 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg';
    // ★ [수정] 단순히 'united'만 있으면 안 되고 'man'도 있어야 함
    if (lowerName.includes('man utd') || lowerName.includes('manchester united')) return 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg';

    // 3. 나머지 프리미어리그 팀
    if (lowerName.includes('arsenal')) return 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg';
    // ★ [수정] 아스톤 빌라 (Aston Villa) 확실하게 잡기
    if (lowerName.includes('aston') || lowerName.includes('villa')) return 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg';
    
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
    
    // 4. 기타 팀 (챔피언십 등)
    if (lowerName.includes('sunderland')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/366.png';
    if (lowerName.includes('watford')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/395.png';
    if (lowerName.includes('norwich')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/381.png';
    if (lowerName.includes('west brom')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/383.png';
    if (lowerName.includes('stoke')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/336.png';
    if (lowerName.includes('hull')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/306.png';
    if (lowerName.includes('middlesbrough')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/369.png';
    if (lowerName.includes('blackburn')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/365.png';
    if (lowerName.includes('burnley')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/379.png';

    // 기본 로고
    return 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg';
  };

export async function getRealMatches(): Promise<MatchData[]> {
  try {
    // 백엔드 서버에서 데이터 가져오기 (실시간 반영)
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 } 
    });

    if (!response.ok) {
      console.error('서버 연결 실패:', response.status);
      return [];
    }

    const matchesData = await response.json();

    if (!matchesData || matchesData.length === 0) return [];

    // 데이터 변환
    const matches: MatchData[] = matchesData.map((item: any) => {
      let displayStatus = item.status;
      if (['SCHEDULED', 'TIMED'].includes(item.status)) displayStatus = 'UPCOMING';
      if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(item.status)) displayStatus = 'LIVE';

      return {
        id: item.id,
        homeTeam: item.home,
        awayTeam: item.away,
        // ★ 여기서 최신 로고 함수 사용
        homeLogo: getTeamBadge(item.home),
        awayLogo: getTeamBadge(item.away),
        
        matchTime: item.matchTime || item.date + ' ' + item.time, 
        status: displayStatus,
        score: {
          home: item.score?.home ?? 0,
          away: item.score?.away ?? 0
        },
        odds: item.odds || { home: 1.0, draw: 1.0, away: 1.0 }
      };
    });

    return matches;

  } catch (error) {
    console.error('경기 데이터 불러오기 실패:', error);
    return []; 
  }
}