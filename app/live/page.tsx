// ★ 수정됨: @ 대신 ../.. 를 사용해서 직접 찾도록 변경
import LiveMatchCard from '../../components/LiveMatchCard'; 
import { getRealMatches } from '@/utils/footballApi';

export const dynamic = 'force-dynamic';

export default async function LivePage() {
  // 1. 실제 데이터 가져오기
  const allMatches = await getRealMatches();
  
  // 2. 진짜 LIVE 상태인 것만 필터링
  const liveMatches = allMatches.filter(m => m.status === 'LIVE');

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic text-white flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                {/* 라이브 경기가 있을 때만 빨간불 깜빡임 효과 */}
                {liveMatches.length > 0 ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-slate-600"></span>
                )}
              </span>
              LIVE ARENA
            </h1>
            <p className="text-slate-400 mt-2 ml-7">
              현재 진행 중인 프리미어리그 경기입니다.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6">
        {liveMatches.length > 0 ? (
          liveMatches.map((match) => (
            // ★ [수정됨] match={match as any} 로 변경하여 타입 에러 해결
            <LiveMatchCard key={match.id} match={match as any} />
          ))
        ) : (
          <div className="text-center py-32 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 text-slate-500">
            <div className="text-4xl mb-4">😴</div>
            <p className="text-xl font-bold text-white mb-2">현재 진행 중인 경기가 없습니다.</p>
            <span className="text-sm text-slate-400 block max-w-md mx-auto leading-relaxed">
              지금은 프리미어리그 경기 시간이 아닙니다.<br/>
              '예정된 경기' 탭에서 다음 빅매치 일정을 확인하고 미리 베팅하세요.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}