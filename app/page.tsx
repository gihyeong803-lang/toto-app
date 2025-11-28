import Image from 'next/image';
import Link from 'next/link';
import MatchCard from '@/components/MatchCard';
import { getRealMatches } from '@/utils/footballApi';
import { allMatches as mockData } from '@/utils/mockMatches';
// MobileHeaderProfile import 제거 (레이아웃으로 이동했으므로)

export const dynamic = 'force-dynamic';

const getTeamLogo = (teamName: string) => {
  const name = teamName?.toLowerCase() || '';
  const baseUrl = 'https://resources.premierleague.com/premierleague/badges';

  if (name.includes('arsenal')) return `${baseUrl}/t3.svg`;
  if (name.includes('aston villa') || name.includes('villa')) return `${baseUrl}/t7.svg`;
  if (name.includes('bournemouth')) return `${baseUrl}/t91.svg`;
  if (name.includes('brentford')) return `${baseUrl}/t94.svg`;
  if (name.includes('brighton')) return `${baseUrl}/t36.svg`;
  if (name.includes('burnley')) return `${baseUrl}/t90.svg`;
  if (name.includes('chelsea')) return `${baseUrl}/t8.svg`;
  if (name.includes('crystal palace') || name.includes('palace')) return `${baseUrl}/t31.svg`;
  if (name.includes('everton')) return `${baseUrl}/t11.svg`;
  if (name.includes('fulham')) return `${baseUrl}/t54.svg`;
  if (name.includes('liverpool')) return `${baseUrl}/t14.svg`;
  if (name.includes('luton')) return `${baseUrl}/t102.svg`;
  if (name.includes('man city') || name.includes('manchester city')) return `${baseUrl}/t43.svg`;
  if (name.includes('man utd') || name.includes('manchester united')) return `${baseUrl}/t1.svg`;
  if (name.includes('newcastle')) return `${baseUrl}/t4.svg`;
  if (name.includes('nottingham') || name.includes('forest')) return `${baseUrl}/t17.svg`;
  if (name.includes('sheffield')) return `${baseUrl}/t49.svg`;
  if (name.includes('tottenham') || name.includes('spurs')) return `${baseUrl}/t6.svg`;
  if (name.includes('west ham')) return `${baseUrl}/t21.svg`;
  if (name.includes('wolves') || name.includes('wolverhampton')) return `${baseUrl}/t39.svg`;
  if (name.includes('leeds')) return `${baseUrl}/t2.svg`;
  if (name.includes('leicester')) return `${baseUrl}/t13.svg`;
  if (name.includes('southampton')) return `${baseUrl}/t20.svg`;
  if (name.includes('ipswich')) return `${baseUrl}/t40.svg`;
  if (name.includes('sunderland')) return `${baseUrl}/t56.svg`;
  if (name.includes('watford')) return `${baseUrl}/t57.svg`;
  if (name.includes('norwich')) return `${baseUrl}/t45.svg`;
  
  return `https://assets.codepen.io/t-1/premier-league-logo.png`;
};

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

  matches = matches.filter(match => {
    const status = match.status || 'UPCOMING';
    return status !== 'FINISHED' && status !== 'FT' && status !== 'AWARDED';
  });

  const headerLogo = selectedTeam ? getTeamLogo(selectedTeam) : "/pl-logo.avif";

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
             />
           </div>
           <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter text-center drop-shadow-2xl">
             {selectedTeam}
           </h1>
        </header>
      ) : (
        // ★ [수정됨] 버튼 제거하고 원래대로 왼쪽 정렬
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
              homeLogo: match.homeLogo || getTeamLogo(homeName),
              awayLogo: match.awayLogo || getTeamLogo(awayName),
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