// utils/mockMatches.ts

// 1. API 데이터와 Mock 데이터 모두 호환되도록 타입 수정 (물음표 ? 추가)
export interface MatchData {
  id: number;
  status: string;
  
  // API 데이터는 객체로 오고, Mock은 문자열일 수 있으므로 둘 다 허용
  homeTeam: string | any; 
  awayTeam: string | any;
  
  // 아래 필드들은 API 데이터에 없을 수 있으므로 Optional(?) 처리
  league?: string;
  date?: string;
  matchTime?: string;
  
  score: {
    home: number | null; // API는 null이 올 수 있음
    away: number | null;
  };
  
  // 배팅 정보도 API엔 없을 수 있음
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
  handicap?: {
    value: number;
    home: number;
    away: number;
  };
  overUnder?: {
    value: number;
    over: number;
    under: number;
  };
}

// 2. 기존 Mock 데이터
export const allMatches: MatchData[] = [
  {
    id: 1,
    league: 'Premier League',
    homeTeam: 'Burnley FC',
    awayTeam: 'Chelsea FC',
    date: '11. 22.',
    matchTime: '21:30',
    status: 'UPCOMING',
    score: { home: 0, away: 0 },
    odds: { home: 3.50, draw: 4.60, away: 4.30 },
    handicap: { value: -1.0, home: 5.50, away: 1.15 },
    overUnder: { value: 2.5, over: 1.85, under: 1.95 }
  },
  {
    id: 2,
    league: 'Premier League',
    homeTeam: 'Bournemouth',
    awayTeam: 'West Ham',
    date: '11. 23.',
    matchTime: '24:00',
    status: 'UPCOMING',
    score: { home: 0, away: 0 },
    odds: { home: 2.10, draw: 3.45, away: 2.90 },
    handicap: { value: -0.5, home: 2.40, away: 1.55 },
    overUnder: { value: 2.5, over: 1.70, under: 2.10 }
  },
  {
    id: 3,
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Nottm Forest',
    date: '11. 24.',
    matchTime: '00:00',
    status: 'UPCOMING',
    score: { home: 0, away: 0 },
    odds: { home: 1.36, draw: 5.50, away: 8.00 },
    handicap: { value: -1.5, home: 2.05, away: 1.78 },
    overUnder: { value: 3.5, over: 2.20, under: 1.65 }
  }
];