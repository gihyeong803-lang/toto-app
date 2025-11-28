'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams(); 
  const currentTeam = searchParams.get('team'); 

  // 메뉴 아이템 컴포넌트
  const MenuItem = ({ href, label, isActive = false, isLive = false }: any) => (
    <Link 
      href={href} 
      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all mb-1
        ${isActive 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'}
      `}
    >
      <div className="flex justify-between items-center">
        <span>{label}</span>
        {isLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
      </div>
    </Link>
  );

  const TeamItem = ({ name, queryName }: { name: string, queryName: string }) => {
    const isActive = currentTeam === queryName;
    
    return (
      <Link 
        href={`/?team=${encodeURIComponent(queryName)}`}
        className={`block px-4 py-2 text-sm cursor-pointer transition-colors rounded-md mb-1
          ${isActive 
            ? 'text-emerald-400 bg-emerald-400/10 font-bold' 
            : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800/50'}
        `}
      >
        {name}
      </Link>
    );
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#12141e] border-r border-slate-800">
      
      {/* 1. 상단 로고 */}
      <div className="p-6 mb-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <span className="text-emerald-400">⚽</span> Premier League
        </div>
        <div className="text-slate-500 text-xs mt-1">2025-2026 Season</div>
      </div>

      {/* 2. 네비게이션 */}
      <nav className="flex-1 px-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="text-[10px] font-bold text-slate-500 mb-2 px-2 uppercase tracking-wider">
          Match Filters
        </div>
        
        <MenuItem href="/" label="전체 경기" isActive={pathname === '/' && !currentTeam} />
        <MenuItem href="/live" label="실시간 (LIVE)" isLive={true} isActive={pathname === '/live'} />
        <MenuItem href="/upcoming" label="예정된 경기" isActive={pathname === '/upcoming'} />
        
        {/* ★ [이동됨] 경기 결과 (예정된 경기 바로 밑으로 이동) */}
        <MenuItem href="/results" label="경기 결과" isActive={pathname === '/results'} />

        <MenuItem href="/mypage" label="내 배팅 내역" isActive={pathname === '/mypage'} />
        
        {/* 머니 충전소 */}
        <MenuItem href="/charge" label="머니 충전소" isActive={pathname === '/charge'} />
        
        {/* 머니 환전소 */}
        <MenuItem href="/exchange" label="머니 환전소" isActive={pathname === '/exchange'} />

        <div className="my-6 h-px bg-slate-800"></div>

        {/* 3. 인기 팀 목록 */}
        <div className="text-[10px] font-bold text-slate-500 mb-2 px-2 uppercase tracking-wider">
          Popular Teams
        </div>
        <div className="space-y-1 pb-4">
          <TeamItem name="Man City" queryName="Man City" />
          <TeamItem name="Liverpool" queryName="Liverpool" />
          <TeamItem name="Arsenal" queryName="Arsenal" />
          <TeamItem name="Tottenham" queryName="Tottenham" />
          <TeamItem name="Man Utd" queryName="Man Utd" />
          <TeamItem name="Chelsea" queryName="Chelsea" />
          <TeamItem name="Newcastle" queryName="Newcastle" />
          <TeamItem name="Aston Villa" queryName="Aston Villa" />
        </div>
      </nav>

      <div className="p-4 text-[10px] text-slate-600 text-center border-t border-slate-800/50">
        © 2025 Sports Toto
      </div>
    </aside>
  );
}