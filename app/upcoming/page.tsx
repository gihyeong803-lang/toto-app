import Image from 'next/image';
import MatchCard from '@/components/MatchCard';
import { getRealMatches } from '@/utils/footballApi';
import { MatchData } from '@/utils/mockMatches';

export const dynamic = 'force-dynamic';

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

  // 로고 찾는 함수 (내부 정의 - 혹시 데이터에 로고가 없을 때 대비)
  const getTeamBadge = (name: string) => {
    const lowerName = name?.toLowerCase() || '';
    // ... (기존 로직과 동일하게 프리미어리그 로고 등 리턴)
    return `https://assets.codepen.io/t-1/premier-league-logo.png`; 
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-0"> {/* 모바일 하단 바 여백 추가 */}
      
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

      {/* ★ 1. 메인 빅매치 배너 (모바일 최적화) */}
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
                {/* 모바일 w-16, PC w-24 */}
                <div className="w-16 h-16 md:w-24 md:h-24 relative drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  <Image 
                    src={featuredMatch.homeLogo || getTeamBadge(featuredMatch.homeTeam)} 
                    alt={featuredMatch.homeTeam} 
                    fill 
                    className="object-contain" 
                  />
                </div>
                {/* 모바일 텍스트 작게 & 줄바꿈 허용 */}
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
                  <Image 
                    src={featuredMatch.awayLogo || getTeamBadge(featuredMatch.awayTeam)} 
                    alt={featuredMatch.awayTeam} 
                    fill 
                    className="object-contain" 
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