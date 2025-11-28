'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function ChargePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async () => {
    if (!amount || parseInt(amount) < 1000) return alert('최소 1,000원 이상 입력하세요.');

    const currentUserId = user ? (user as any).userid : null;

    if (!currentUserId) {
        alert("로그인이 필요합니다.");
        router.push('/login');
        return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('https://toto-server-f4j2.onrender.com/api/charge/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: currentUserId, amount }),
      });
      const data = await res.json();
      if (data.success) {
        alert('충전 신청이 완료되었습니다.\n관리자 승인 후 반영됩니다.');
        router.push('/mypage');
      } else {
        alert('신청 실패: ' + data.message);
      }
    } catch (err) {
      alert('서버 연결 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-4">
      {/* 1. 헤더 섹션 (다른 페이지와 통일) */}
      <header className="mb-8">
        <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">
          Money Charge
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1">
          게임머니 충전 신청 페이지입니다.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. 왼쪽: 입금 계좌 정보 카드 */}
        <div className="bg-[#1e2130] p-8 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div>
            <div className="text-xs font-bold text-emerald-400 mb-2 tracking-wider uppercase">
              Bank Information
            </div>
            <h2 className="text-2xl font-bold text-white mb-6">
              입금 전용 계좌
            </h2>
            
            <div className="space-y-4">
              <div className="bg-[#161925] p-4 rounded-xl border border-slate-700/50">
                <span className="text-slate-500 text-xs block mb-1">은행명</span>
                <span className="text-white font-bold text-lg">KB국민은행</span>
              </div>
              
              <div className="bg-[#161925] p-4 rounded-xl border border-slate-700/50">
                <span className="text-slate-500 text-xs block mb-1">계좌번호</span>
                <span className="text-emerald-400 font-mono font-bold text-xl tracking-wide">
                  9377-02-01071156
                </span>
              </div>

              <div className="bg-[#161925] p-4 rounded-xl border border-slate-700/50">
                <span className="text-slate-500 text-xs block mb-1">예금주</span>
                <span className="text-white font-bold text-lg">강기현 (관리자)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-slate-400 text-xs leading-relaxed">
              * 반드시 <span className="text-white font-bold">회원 가입시 등록한 예금주명</span>으로 입금해주세요.<br/>
              * 입금 후 신청 버튼을 누르시면 관리자 확인 후 즉시 처리됩니다.
            </p>
          </div>
        </div>

        {/* 3. 오른쪽: 충전 금액 입력 폼 */}
        <div className="bg-[#1e2130] p-8 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col justify-center">
           <div className="mb-6">
             <label className="block text-slate-400 text-xs font-bold mb-3 uppercase">
               Charge Amount
             </label>
             <div className="relative">
               <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#12141e] border border-slate-700 rounded-xl px-4 py-5 text-white text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600"
                  placeholder="충전할 금액을 입력하세요"
               />
               <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold">
                 KRW
               </span>
             </div>
             
             {/* 금액 퀵 버튼 (선택사항) */}
             <div className="flex gap-2 mt-3">
               {[10000, 30000, 50000, 100000].map((val) => (
                 <button 
                   key={val}
                   onClick={() => setAmount(val.toString())}
                   className="flex-1 bg-[#161925] hover:bg-slate-700 text-slate-400 hover:text-white text-xs py-2 rounded-lg border border-slate-700 transition-colors"
                 >
                   +{val.toLocaleString()}
                 </button>
               ))}
             </div>
           </div>

           <button 
             onClick={handleRequest}
             disabled={isLoading}
             className={`w-full py-5 rounded-xl font-black text-lg uppercase tracking-wider transition-all transform active:scale-95
               ${isLoading 
                 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                 : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/30'}
             `}
           >
             {isLoading ? '처리 중...' : '충전 신청하기'}
           </button>
        </div>

      </div>
    </div>
  );
}