import Image from 'next/image';
import MatchCard from '@/components/MatchCard';
import { getRealMatches } from '@/utils/footballApi';

// 캐시 방지: 항상 최신 데이터 로드
export const dynamic = 'force-dynamic';

// URL의 ID(mancity 등)를 API가 사용하는 실제 팀 이름(검색어)으로 매핑
const teamSearchMap: Record<string, string> = {
  'mancity': 'Manchester City',
  'liverpool': 'Liverpool',
  'arsenal': 'Arsenal',
  'tottenham': 'Tottenham',
  'manutd': 'Manchester United',
  'chelsea': 'Chelsea',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: PageProps) {
  // 1. URL 파라미터 가져오기
  const { id } = await params;
  const searchName = teamSearchMap[id] || id;

  // 2. 실제 API 데이터 가져오기
  const allMatches = await getRealMatches();

  // 3. 해당 팀이 포함된 경기만 필터링 (홈 또는 원정)
  const teamMatches = allMatches.filter(
    m => m.homeTeam.includes(searchName) || m.awayTeam.includes(searchName)
  );

  // 4. 팀 로고 찾기 (검색된 경기 데이터 중 하나에서 로고 추출)
  let teamLogo = '';
  if (teamMatches.length > 0) {
    const firstMatch = teamMatches[0];
    // 홈팀 이름에 검색어가 포함되어 있으면 홈팀 로고, 아니면 원정팀 로고 사용
    if (firstMatch.homeTeam.includes(searchName)) {
      teamLogo = firstMatch.homeLogo || '';
    } else {
      teamLogo = firstMatch.awayLogo || '';
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 border-b border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 relative bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-700 overflow-hidden p-4">
            {teamLogo ? (
              <Image 
                src={teamLogo} 
                alt={searchName} 
                fill
                className="object-contain p-2"
              />
            ) : (
              <span className="text-4xl">🛡️</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{searchName}</h1>
            <p className="text-emerald-400 text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              최근 및 예정된 경기
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4">
        {teamMatches.length > 0 ? (
          teamMatches.map((match) => (
             // @ts-ignore
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-500">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-lg">예정된 경기가 없습니다.</p>
            <span className="text-sm text-slate-600">
              (현재 API 조회 범위 내에 {searchName}의 경기가 없습니다)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}