import Image from 'next/image';
import MatchCard from '@/components/MatchCard';
import { getRealMatches } from '@/utils/footballApi';
import { MatchData } from '@/utils/mockMatches';

export const dynamic = 'force-dynamic';

// [수정됨] 로고 매핑 함수 (LiveMatchCard와 로직 통일하여 안정성 확보)
const getTeamBadge = (teamName: string) => {
  const name = teamName?.toLowerCase() || '';
  // 프리미어리그 공식 로고 베이스 URL
  const plBaseUrl = 'https://resources.premierleague.com/premierleague/badges';

  // 1. 프리미어리그 팀 (공식 리소스 사용 - 가장 정확함)
  if (name.includes('arsenal')) return `${plBaseUrl}/t3.svg`;
  if (name.includes('villa')) return `${plBaseUrl}/t7.svg`; // ★ 아스톤 빌라 (Aston Villa) 해결
  if (name.includes('bournemouth')) return `${plBaseUrl}/t91.svg`;
  if (name.includes('brentford')) return `${plBaseUrl}/t94.svg`;
  if (name.includes('brighton')) return `${plBaseUrl}/t36.svg`;
  if (name.includes('burnley')) return `${plBaseUrl}/t90.svg`;
  if (name.includes('chelsea')) return `${plBaseUrl}/t8.svg`;
  if (name.includes('palace')) return `${plBaseUrl}/t31.svg`;
  if (name.includes('everton')) return `${plBaseUrl}/t11.svg`;
  if (name.includes('fulham')) return `${plBaseUrl}/t54.svg`;
  if (name.includes('ipswich')) return `${plBaseUrl}/t40.svg`;
  if (name.includes('leicester')) return `${plBaseUrl}/t13.svg`;
  if (name.includes('liverpool')) return `${plBaseUrl}/t14.svg`;
  if (name.includes('luton')) return `${plBaseUrl}/t102.svg`;
  if (name.includes('city')) return `${plBaseUrl}/t43.svg`; // Man City
  if (name.includes('man utd') || name.includes('united')) return `${plBaseUrl}/t1.svg`; // Man Utd
  if (name.includes('newcastle')) return `${plBaseUrl}/t4.svg`;
  if (name.includes('forest') || name.includes('nottingham')) return `${plBaseUrl}/t17.svg`;
  if (name.includes('southampton')) return `${plBaseUrl}/t20.svg`;
  if (name.includes('sheffield')) return `${plBaseUrl}/t49.svg`;
  if (name.includes('tottenham') || name.includes('spurs')) return `${plBaseUrl}/t6.svg`;
  if (name.includes('west ham')) return `${plBaseUrl}/t21.svg`;
  if (name.includes('wolves') || name.includes('wolverhampton')) return `${plBaseUrl}/t39.svg`;

  // 2. 챔피언십 및 기타 팀 (ESPN 고화질 로고 사용 - 백업용)
  if (name.includes('sunderland')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/366.png';
  if (name.includes('leeds')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/357.png';
  if (name.includes('watford')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/395.png';
  if (name.includes('norwich')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/381.png';
  if (name.includes('west brom')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/383.png';
  if (name.includes('stoke')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/336.png';
  if (name.includes('hull')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/306.png';
  if (name.includes('middlesbrough')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/369.png';
  if (name.includes('blackburn')) return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/365.png';

  // 기본 이미지
  return 'https://assets.codepen.io/t-1/premier-league-logo.png';
};

export default async function UpcomingPage() {
  const allMatches = await getRealMatches();
  const upcomingMatches = allMatches.filter(m => m.status === 'UPCOMING');

  // 데이터가 없을 경우 처리
  if (upcomingMatches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-8 border-b border-slate-700 pb-6 mt-4">
          <h1 className="text-2xl md:text-3xl font-black italic text-white flex items-center gap-3 tracking-tighter">
            UPCOMING MATCHES
          </h1>
        </header>
        <div className="text-center py-32 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-500">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-lg">예정된 경기가 없습니다.</p>
        </div>
      </div>
    );
  }

  // 1. 가장 빠른 첫 번째 경기를 '빅매치'로 선정
  const featuredMatch = upcomingMatches[0];
  
  // 2. 나머지 경기들은 리스트로
  const otherMatches = upcomingMatches.slice(1);

  // 3. 날짜별 그룹화 함수
  const groupedMatches = otherMatches.reduce((acc, match) => {
    const dateKey = match.matchTime.split(' ').slice(0, 2).join(' '); 
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, MatchData[]>);

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-0"> 
      
      {/* 헤더 */}
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-700 pb-4 mt-2 px-2">
        <div className="mb-3 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter mb-1 flex items-center gap-2">
            <span className="text-3xl md:text-4xl">🗓️</span> UPCOMING
          </h1>
          <p className="text-slate-400 text-xs md:text-sm ml-1">다음 프리미어리그 경기 일정입니다.</p>
        </div>
        <span className="self-start md:self-auto text-[10px] md:text-xs font-bold bg-slate-800 text-emerald-400 px-3 py-1 rounded-full border border-slate-600">
          {upcomingMatches.length} Matches
        </span>
      </header>

      {/* ★ 1. 메인 빅매치 배너 */}
      <section className="mb-8 md:mb-12 px-2 md:px-0">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-slate-700 group">
          {/* 배경 이미지 효과 */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
          
          <div className="relative z-10 p-4 md:p-8 flex flex-col items-center text-center">
            <span className="bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 rounded-full mb-4 md:mb-6 animate-pulse shadow-lg shadow-red-600/40">
              NEXT BIG MATCH
            </span>

            <div className="flex items-center justify-between w-full gap-2 md:gap-8 mb-6">
              
              {/* 홈팀 */}
              <div className="flex flex-col items-center gap-2 md:gap-4 w-1/3">
                <div className="w-16 h-16 md:w-24 md:h-24 relative drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {/* ★ unoptimized 필수 적용 */}
                  <Image 
                    src={getTeamBadge(featuredMatch.homeTeam)} 
                    alt={featuredMatch.homeTeam} 
                    fill 
                    className="object-contain" 
                    unoptimized
                  />
                </div>
                <span className="text-xs md:text-2xl font-black text-white uppercase tracking-tight break-words w-full leading-tight">
                  {featuredMatch.homeTeam}
                </span>
              </div>

              {/* VS & 시간 */}
              <div className="flex flex-col items-center w-1/3">
                <span className="text-2xl md:text-4xl font-black italic text-slate-700">VS</span>
                <div className="mt-1 md:mt-2 bg-black/30 px-2 md:px-4 py-1 rounded text-emerald-400 font-mono font-bold text-xs md:text-lg border border-emerald-500/30 whitespace-nowrap">
                  {featuredMatch.matchTime}
                </div>
              </div>

              {/* 원정팀 */}
              <div className="flex flex-col items-center gap-2 md:gap-4 w-1/3">
                <div className="w-16 h-16 md:w-24 md:h-24 relative drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {/* ★ unoptimized 필수 적용 */}
                  <Image 
                    src={getTeamBadge(featuredMatch.awayTeam)} 
                    alt={featuredMatch.awayTeam} 
                    fill 
                    className="object-contain" 
                    unoptimized
                  />
                </div>
                <span className="text-xs md:text-2xl font-black text-white uppercase tracking-tight break-words w-full leading-tight">
                  {featuredMatch.awayTeam}
                </span>
              </div>
            </div>

            {/* 바로 베팅하기 */}
            <div className="w-full md:max-w-2xl transform scale-100 md:scale-95 opacity-100 md:opacity-90 hover:scale-100 hover:opacity-100 transition-all duration-300">
               {/* @ts-ignore */}
              <MatchCard match={featuredMatch} />
            </div>
          </div>
        </div>
      </section>

      {/* ★ 2. 날짜별 경기 리스트 */}
      <section className="space-y-6 md:space-y-10 px-2 md:px-0">
        {Object.entries(groupedMatches).map(([date, matches]) => (
          <div key={date} className="relative">
            {/* 날짜 헤더 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px bg-slate-700 flex-1"></div>
              <span className="text-sm md:text-lg font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 shadow-sm">
                📅 {date}
              </span>
              <div className="h-px bg-slate-700 flex-1"></div>
            </div>

            {/* 해당 날짜의 경기들 */}
            <div className="grid gap-3 md:gap-4">
              {matches.map((match) => (
                // @ts-ignore
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}