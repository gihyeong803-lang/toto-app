import Image from 'next/image';
import Link from 'next/link';
import MatchCard from '@/components/MatchCard';
// ★ [수정 1] footballApi에서 중앙 관리되는 로고 함수 가져오기
import { getRealMatches, getTeamBadge } from '@/utils/footballApi';
import { allMatches as mockData } from '@/utils/mockMatches';

export const dynamic = 'force-dynamic';

// ❌ [삭제] 파일 안에 있던 옛날 getTeamLogo 함수 제거 (중복 코드 삭제)

interface HomeProps {
  searchParams: Promise<{ team?: string }>;
}

export default async function Home(props: HomeProps) {
  let matches: any[] = [];
  const searchParams = await props.searchParams;
  const selectedTeam = searchParams?.team;

  try {
    matches = await getRealMatches();
  } catch (err) {
    console.error("API Error:", err);
  }

  if (!matches || matches.length === 0) {
    matches = mockData;
  }

  if (selectedTeam) {
    const target = selectedTeam.toLowerCase();
    matches = matches.filter(match => {
      const home = (match.homeTeam || match.home || "").toLowerCase();
      const away = (match.awayTeam || match.away || "").toLowerCase();
      if (target === 'man utd') return home.includes('united') || home.includes('utd') || away.includes('united') || away.includes('utd');
      if (target === 'man city') return home.includes('city') || away.includes('city');
      if (target === 'tottenham') return home.includes('tottenham') || home.includes('spurs') || away.includes('tottenham') || away.includes('spurs');
      return home.includes(target) || away.includes(target);
    });
  }

  // 종료된 경기 필터링
  matches = matches.filter(match => {
    const status = match.status || 'UPCOMING';
    return status !== 'FINISHED' && status !== 'FT' && status !== 'AWARDED';
  });

  // ★ [수정 2] 헤더 로고도 통합 함수 사용 (getTeamLogo -> getTeamBadge)
  const headerLogo = selectedTeam ? getTeamBadge(selectedTeam) : "/pl-logo.avif";

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 md:pb-0">
      
      {selectedTeam ? (
        <header className="mb-12 mt-8 relative flex flex-col items-center justify-center gap-6">
           <div className="relative w-48 h-48 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
             <Image
               src={headerLogo}
               alt={selectedTeam}
               fill
               className="object-contain"
               unoptimized
             />
           </div>
           <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter text-center drop-shadow-2xl">
             {selectedTeam}
           </h1>
        </header>
      ) : (
        <header className="mb-8 mt-6 flex items-center gap-4">
          <div className="relative w-12 h-12 shadow-lg rounded-full overflow-hidden border-2 border-slate-700 bg-[#1a1d26]">
            <Image src="/pl-logo.avif" alt="Logo" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic text-white flex items-center gap-3 tracking-tight">
              Hot Matches 
              <span className="text-[10px] font-bold not-italic bg-slate-700 text-emerald-400 px-2 py-0.5 rounded shadow-sm border border-slate-600">
                REAL DATA
              </span>
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-1">
              EPL 실제 경기 일정을 불러옵니다.
            </p>
          </div>
        </header>
      )}
      
      <div className="grid gap-4 w-full">
        {matches.length > 0 ? (
          matches.map((match: any) => {
            const homeName = match.homeTeam || match.home || "Home Team";
            const awayName = match.awayTeam || match.away || "Away Team";

            const normalizedMatch = {
              id: match.id,
              homeTeam: homeName,
              awayTeam: awayName,
              // ★ [수정 3] 여기서도 getTeamBadge 사용 (로고 통일)
              homeLogo: match.homeLogo || getTeamBadge(homeName),
              awayLogo: match.awayLogo || getTeamBadge(awayName),
              matchTime: match.matchTime || match.time || "00:00",
              status: match.status || 'UPCOMING',
              score: match.score || { home: 0, away: 0 },
              odds: match.odds,
            };

            return (
              // @ts-ignore
              <MatchCard key={match.id} match={normalizedMatch} />
            );
          })
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-[#1a1d26]/30">
            <div className="text-5xl mb-4 opacity-30">⚽</div>
            <p className="text-slate-500 font-bold text-lg">예정된 경기가 없습니다.</p>
            <Link href="/" className="text-emerald-500 font-bold text-sm hover:underline mt-3 inline-block">
              전체 목록 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}