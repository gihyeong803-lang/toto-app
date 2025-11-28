import './globals.css';
import Sidebar from '@/components/Sidebar';
import BettingSlip from '@/components/BettingSlip';
import NoticePopup from '@/components/NoticePopup';
import { MobileNav } from '@/components/MobileNav'; 
import MobileHeaderProfile from '@/components/MobileHeaderProfile'; 
import { Fragment, Suspense } from 'react'; // ★ Suspense 추가
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'EPL Sports Toto',
  description: 'Premier League Betting Simulation',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 클라이언트 전용 Wrapper
const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Fragment>{children}</Fragment>;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="bg-[#12141e] text-slate-200 h-full w-screen overflow-hidden font-sans selection:bg-emerald-500/30">
        
        <NoticePopup />

        <ClientWrapper> 
          <div className="flex h-full w-full flex-col md:flex-row">
            
            {/* 1. 왼쪽 사이드바 (Suspense 적용) */}
            <div className="hidden md:block w-[260px] lg:w-[300px] flex-none border-r border-slate-800/50 bg-[#161925] z-30">
              <Suspense fallback={<div className="w-full h-full bg-[#161925]" />}>
                <Sidebar />
              </Suspense>
            </div>
            
            {/* 2. 메인 콘텐츠 */}
            <main className="flex-1 h-full overflow-y-auto relative scroll-smooth bg-[#12141e] min-w-0 no-scrollbar pb-24 md:pb-0">
              
              {/* 모바일 상단 앱바 */}
              <div className="md:hidden flex items-center justify-center h-14 bg-[#161925] border-b border-slate-800 sticky top-0 z-40 relative">
                 <span className="font-black italic text-white text-lg">
                   SPORTS <span className="text-emerald-500">TOTO</span>
                 </span>

                 <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <MobileHeaderProfile />
                 </div>
              </div>

              <div className="max-w-6xl mx-auto w-full p-4 md:p-6">
                {children}
              </div>
            </main>
            
            {/* 3. 오른쪽 배팅 슬립 (Suspense 적용) */}
            <div className="hidden xl:block w-[300px] flex-none border-l border-slate-800/50 bg-[#161925] z-30 shadow-2xl">
              <Suspense fallback={<div className="w-full h-full bg-[#161925]" />}>
                <BettingSlip />
              </Suspense>
            </div>

            {/* 4. 모바일 하단 내비게이션 (Suspense 적용) */}
            <Suspense fallback={null}>
              <MobileNav />
            </Suspense>

          </div>
        </ClientWrapper>
      </body>
    </html>
  );
}