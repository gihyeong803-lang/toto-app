'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function ExchangePage() {
  const { user, login } = useAuthStore(); 
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // =================================================================
  // [★ 핵심 추가] 페이지 접속 시 서버에서 "최신 유저 정보" 다시 가져오기
  // =================================================================
  useEffect(() => {
    setIsMounted(true);

    const refreshUserInfo = async () => {
      // 1. 로그인 안 했으면 굳이 서버에 안 물어봄
      if (!user) return;

      try {
        // 2. 서버에 "내 정보 다시 줘!" 요청 (아까 server.js에 만든 그 주소)
        const res = await fetch('http://localhost:4000/api/user/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid: (user as any).userid }) 
        });
        const data = await res.json();
        
        // 3. 서버가 최신 정보(은행 포함)를 주면, 내 브라우저 정보를 갱신!
        if (data.success && data.user) {
            console.log("서버에서 받은 최신 정보:", data.user); 
            login(data.user); // ★ 여기서 '미등록' -> '국민은행'으로 바뀝니다.
        }
      } catch (e) {
        console.error("정보 갱신 실패:", e);
      }
    };

    refreshUserInfo();
  }, []); // 빈 배열: 페이지 처음 떴을 때 딱 1번 실행
  // =================================================================


  const handleExchange = async () => {
    if (!amount || parseInt(amount) < 10000) return alert('최소 10,000원 이상부터 환전 가능합니다.');

    const currentUserId = user ? (user as any).userid : null;
    if (!currentUserId) return router.push('/login');

    // [문구 수정] 사용자에게 정확한 안내
    if (!confirm(`${parseInt(amount).toLocaleString()}원을 환전하시겠습니까?\n관리자 승인 후 계좌로 입금되며, 승인 시 머니가 차감됩니다.`)) return;

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/exchange/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: currentUserId, amount }),
      });
      const data = await res.json();
      
      if (data.success) {
        alert('환전 신청이 완료되었습니다.\n관리자가 확인 후 입금 처리해드립니다.');
        router.push('/mypage');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('서버 오류');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  if (!user) {
    return (
        <div className="w-full max-w-4xl mx-auto mt-20 p-4 text-center animate-fadeIn">
          <div className="bg-[#1e2130] p-12 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="text-5xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-4">로그인이 필요한 서비스입니다</h2>
            <p className="text-slate-400 mb-8">환전 서비스를 이용하시려면 먼저 로그인을 해주세요.</p>
            <button 
              onClick={() => router.push('/login')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              로그인 하러가기
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">
          Exchange Money
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1">
          보유하신 게임머니를 실제 현금으로 출금합니다.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 내 정보 카드 */}
        <div className="bg-[#1e2130] p-8 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden">
           <div className="text-xs font-bold text-red-400 mb-2 tracking-wider uppercase">
              My Wallet info
           </div>
           <h2 className="text-2xl font-bold text-white mb-6">출금 계좌 정보</h2>

           <div className="space-y-4">
             <div className="bg-[#161925] p-4 rounded-xl border border-slate-700/50">
                <span className="text-slate-500 text-xs block mb-1">받으실 은행</span>
                <span className="text-white font-bold text-lg">{(user as any).bank || '미등록'}</span>
             </div>
             <div className="bg-[#161925] p-4 rounded-xl border border-slate-700/50">
                <span className="text-slate-500 text-xs block mb-1">계좌번호</span>
                <span className="text-white font-bold text-lg font-mono">{(user as any).accountNumber || '미등록'}</span>
             </div>
             <div className="bg-[#161925] p-4 rounded-xl border border-slate-700/50">
                <span className="text-slate-500 text-xs block mb-1">예금주</span>
                <span className="text-white font-bold text-lg">{(user as any).accountHolder || '미등록'}</span>
             </div>
           </div>
           
           <div className="mt-6 pt-6 border-t border-slate-700/50">
             <div className="flex justify-between items-center">
                <span className="text-slate-400">현재 보유 머니</span>
                <span className="text-2xl font-black text-emerald-400">
                    {user.money ? user.money.toLocaleString() : '0'} 원
                </span>
             </div>
           </div>
        </div>

        {/* 환전 신청 폼 */}
        <div className="bg-[#1e2130] p-8 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col justify-center">
           <div className="mb-6">
             <label className="block text-slate-400 text-xs font-bold mb-3 uppercase">
               Withdrawal Amount
             </label>
             <div className="relative">
               <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#12141e] border border-slate-700 rounded-xl px-4 py-5 text-white text-lg font-bold focus:outline-none focus:border-red-500 transition-all placeholder-slate-600"
                  placeholder="출금할 금액 입력"
               />
               <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold">
                 KRW
               </span>
             </div>
             
             {/* 금액 버튼 */}
             <div className="flex gap-2 mt-3">
               <button 
                onClick={() => setAmount((user.money || 0).toString())} 
                className="flex-1 bg-[#161925] hover:bg-slate-700 text-red-400 text-xs py-2 rounded-lg border border-slate-700 transition-colors"
               >
                 전액 출금
               </button>
               <button onClick={() => setAmount('50000')} className="flex-1 bg-[#161925] hover:bg-slate-700 text-slate-400 hover:text-white text-xs py-2 rounded-lg border border-slate-700 transition-colors">
                 5만
               </button>
               <button onClick={() => setAmount('100000')} className="flex-1 bg-[#161925] hover:bg-slate-700 text-slate-400 hover:text-white text-xs py-2 rounded-lg border border-slate-700 transition-colors">
                 10만
               </button>
             </div>
           </div>

           <button 
             onClick={handleExchange}
             disabled={isLoading}
             className={`w-full py-5 rounded-xl font-black text-lg uppercase tracking-wider transition-all transform active:scale-95
               ${isLoading 
                 ? 'bg-slate-700 cursor-not-allowed' 
                 : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'}
             `}
           >
             {isLoading ? '신청 중...' : '환전 신청하기'}
           </button>
        </div>

      </div>
    </div>
  );
}