// src/utils/footballApi.ts 전체 교체

// ★ [중요] 외부 API 대신 내 Render 서버 주소를 사용
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

// 로고 매핑 함수 (백엔드 데이터엔 로고 URL이 없으므로 프론트에서 처리)
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
  
  return `https://assets.codepen.io/t-1/premier-league-logo.png`; 
};

export async function getRealMatches(): Promise<MatchData[]> {
  try {
    // 1. 내 Render 서버의 DB 데이터 요청 (force-live 등이 반영된 데이터)
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 } // ★ 0초 캐시 (실시간 반영을 위해 캐시 끄기)
    });

    if (!response.ok) {
      console.error('서버 연결 실패:', response.status);
      return [];
    }

    const matchesData = await response.json();

    if (!matchesData || matchesData.length === 0) return [];

    // 2. 데이터 가공 (DB 데이터 -> 프론트엔드 포맷)
    const matches: MatchData[] = matchesData.map((item: any) => {
      // DB 상태값 매핑 (SCHEDULED -> UPCOMING 등 필요 시 변환)
      let displayStatus = item.status;
      if (item.status === 'SCHEDULED' || item.status === 'TIMED') displayStatus = 'UPCOMING';
      if (item.status === 'IN_PLAY' || item.status === 'PAUSED') displayStatus = 'LIVE';

      return {
        id: item.id,
        homeTeam: item.home, // DB 필드명: home
        awayTeam: item.away, // DB 필드명: away
        homeLogo: getTeamBadge(item.home),
        awayLogo: getTeamBadge(item.away),
        
        // DB에 이미 "12. 01. 23:05" 처럼 한국 시간 문자열이 저장되어 있음
        matchTime: item.matchTime || item.date + ' ' + item.time, 
        
        status: displayStatus,
        score: {
          home: item.score?.home ?? 0,
          away: item.score?.away ?? 0
        },
        // DB에 저장된 배당률 사용
        odds: item.odds || { home: 1.0, draw: 1.0, away: 1.0 }
      };
    });

    return matches;

  } catch (error) {
    console.error('경기 데이터 불러오기 실패:', error);
    return []; 
  }
}