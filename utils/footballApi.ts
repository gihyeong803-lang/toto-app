const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';
const LEAGUE_CODE = 'PL';

// [설정] 관리자 수익률 (0.85 = 85% 환급)
const PAYOUT_RATE = 0.85; 

// ★ [추가] 2025-26 시즌 프리미어리그 가상 순위 (낮을수록 강팀)
// 프론트엔드에서도 이 순위를 기반으로 '그럴싸한' 배당을 보여줍니다.
const TEAM_RANKINGS: Record<string, number> = {
    'Manchester City FC': 1, 'Liverpool FC': 2, 'Arsenal FC': 3, 'Tottenham Hotspur FC': 4,
    'Chelsea FC': 5, 'Newcastle United FC': 6, 'Sunderland AFC': 7, 'Manchester United FC': 8,
    'Aston Villa FC': 9, 'Brighton & Hove Albion FC': 10, 'West Ham United FC': 11, 'Brentford FC': 12,
    'Wolverhampton Wanderers FC': 13, 'Crystal Palace FC': 14, 'Fulham FC': 15, 'Nottingham Forest FC': 16,
    'AFC Bournemouth': 17, 'Everton FC': 18, 'Burnley FC': 19, 'Leeds United FC': 20
};

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

interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { name: string; tla: string; crest: string };
  awayTeam: { name: string; tla: string; crest: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

const mapStatus = (status: string): 'LIVE' | 'UPCOMING' | 'FINISHED' => {
  if (['IN_PLAY', 'PAUSED'].includes(status)) return 'LIVE';
  if (['FINISHED', 'AWARDED'].includes(status)) return 'FINISHED';
  return 'UPCOMING';
};

// ★ [핵심 업그레이드] 랭킹 기반 배당률 생성기
const generateMockOdds = (homeName: string, awayName: string) => {
  // 1. 순위 정보 가져오기 (없으면 10위로 가정)
  const homeRank = TEAM_RANKINGS[homeName] || 10;
  const awayRank = TEAM_RANKINGS[awayName] || 10;

  // 2. 전력 차이 계산 (순위가 낮을수록 강팀)
  // 예: 1위(맨시티) vs 20위(리즈) -> 차이 19 -> 맨시티 배당 대폭 하락
  const rankDiff = awayRank - homeRank; // 양수면 홈팀이 강팀
  const homeAdvantage = 0.1; // 홈 이점

  // 3. 기본 배당 공식 (2.30을 기준으로 순위차만큼 이동)
  let baseHome = 2.3 - (rankDiff * 0.05) - homeAdvantage;
  let baseAway = 2.3 + (rankDiff * 0.05) + homeAdvantage;
  
  // 전력이 비슷할수록 무승부 확률 높음 -> 배당 낮음
  // 전력 차가 클수록 무승부 확률 낮음 -> 배당 높음
  let baseDraw = 3.2 + (Math.abs(rankDiff) * 0.03); 

  // 4. 최소 배당 방어 (1.01 미만 안 되게)
  if (baseHome < 1.05) baseHome = 1.05;
  if (baseAway < 1.05) baseAway = 1.05;
  if (baseDraw < 1.05) baseDraw = 1.05;

  // 5. 관리자 수익률 적용
  return {
    home: parseFloat((baseHome * PAYOUT_RATE).toFixed(2)),
    draw: parseFloat((baseDraw * PAYOUT_RATE).toFixed(2)),
    away: parseFloat((baseAway * PAYOUT_RATE).toFixed(2)),
  };
};

export async function getRealMatches(): Promise<MatchData[]> {
  if (!API_KEY) {
    console.warn("⚠️ API_KEY가 없습니다. .env.local 파일을 확인해주세요.");
    return [];
  }

  try {
    // 1. 외부 API에서 경기 정보 가져오기
    const response = await fetch(
      `${BASE_URL}/competitions/${LEAGUE_CODE}/matches?status=SCHEDULED,LIVE,IN_PLAY,PAUSED,FINISHED`, 
      {
        method: 'GET',
        headers: { 'X-Auth-Token': API_KEY },
        next: { revalidate: 60 } 
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const matchesData = data.matches as ApiMatch[];

    if (!matchesData || matchesData.length === 0) return [];

    // 2. 최근 ~ 예정 경기 필터링
    const upcomingAndRecent = matchesData
      .filter(m => {
        const matchDate = new Date(m.utcDate);
        const now = new Date();
        const diffDays = (matchDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        return diffDays > -3 && diffDays < 14;
      })
      .slice(0, 20); 

    // 3. 데이터 가공 (여기서 업그레이드된 배당 함수 사용)
    const matches: MatchData[] = upcomingAndRecent.map((item) => {
      const status = mapStatus(item.status);
      // ★ 여기서 랭킹 기반 배당률이 계산됩니다!
      const odds = generateMockOdds(item.homeTeam.name, item.awayTeam.name);

      return {
        id: item.id,
        homeTeam: item.homeTeam.name, 
        awayTeam: item.awayTeam.name,
        homeLogo: item.homeTeam.crest,
        awayLogo: item.awayTeam.crest,
        
        matchTime: new Date(item.utcDate).toLocaleString('ko-KR', {
          month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false 
        }),
        status: status,
        score: {
          home: item.score.fullTime.home ?? 0,
          away: item.score.fullTime.away ?? 0
        },
        odds: odds
      };
    });

    return matches;

  } catch (error) {
    console.error(error);
    return []; 
  }
}