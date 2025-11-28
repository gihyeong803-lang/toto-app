import MatchCard from '@/components/MatchCard';
import { getRealMatches } from '@/utils/footballApi';

// 캐시 방지: 접속할 때마다 최신 결과 확인
export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  // 1. 실제 데이터 가져오기
  const allMatches = await getRealMatches();

  // 2. FINISHED 상태인 것만 필터링
  const finishedMatches = allMatches.filter(m => m.status === 'FINISHED');

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 border-b border-slate-700 pb-6">
        {/* ★ 폰트 수정: LIVE ARENA와 동일한 스타일 (text-3xl font-black italic text-white) */}
        <h1 className="text-3xl font-black italic text-white flex items-center gap-3 tracking-tighter">
          <span className="not-italic">🏁</span> Match Results
          {finishedMatches.length > 0 && (
            <span className="text-xs font-bold not-italic bg-slate-700 text-slate-400 px-2 py-1 rounded border border-slate-600 align-middle tracking-normal">
              Real Scores
            </span>
          )}
        </h1>
        <p className="text-slate-400 mt-2">지난 경기 결과와 스코어를 확인하세요.</p>
      </header>

      <div className="grid gap-4">
        {finishedMatches.length > 0 ? (
          finishedMatches.map((match) => (
            // @ts-ignore
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-500">
            <p className="text-lg mb-2">최근 종료된 경기가 없습니다.</p>
            <span className="text-sm text-slate-600">
              (시즌 휴식기이거나, API 데이터 조회 범위(최근 3일) 내에 종료된 경기가 없을 수 있습니다)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}