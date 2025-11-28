'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore'; 
import { useRouter } from 'next/navigation';

// =========================================================================================
// [최종 완성본] 관리자 페이지 (전화번호 삭제됨)
// =========================================================================================

interface User { 
  _id?: string; 
  userid: string; 
  password?: string; 
  nickname: string; 
  money: number; 
  bank?: string; 
  accountNumber?: string;
  accountHolder?: string;
  email?: string;    
  // phone?: string; // 삭제됨
  role?: string; 
}

interface Match { 
    id: number; 
    league: string; 
    home: string; 
    away: string; 
    status: string; 
    score: { home: number; away: number }; 
    date: string; 
    isSettled?: boolean; 
}
interface Charge { _id: string; nickname: string; amount: number; status: string; requestTime: string; }
interface Exchange { _id: string; nickname: string; amount: number; bank: string; accountNumber: string; status: string; requestTime: string; }
interface Bet { _id: string; nickname: string; matchInfo: string; pick: string; stake: number; odds: number; status: string; betTime: string; }


export default function AdminPage() {
  const { user, hasHydrated } = useAuthStore(); 
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('USERS'); 
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [bets, setBets] = useState<Bet[]>([]); 
  
  const [scores, setScores] = useState<{ [key: number]: { home: string, away: string } }>({}); 


  // [보안] 권한 체크
  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
        router.replace('/login');
        return;
    }

    if ((user as any).role !== 'admin') {
        alert("관리자만 접근할 수 있는 페이지입니다.");
        router.replace('/'); 
        return;
    }
    
    fetchData();
  }, [user, router, hasHydrated]); 


  // [데이터 로드]
  useEffect(() => {
    if (user && hasHydrated && (user as any).role === 'admin') {
        fetchData();
    }
  }, [activeTab]);


  const fetchData = () => {
    if (!user) return;
    const API_BASE = 'http://localhost:4000'; 
    const adminQuery = `?userid=${(user as any).userid}`;

    if (activeTab === 'MATCHES') fetch(`${API_BASE}/api/matches`).then(r => r.json()).then(setMatches);
    if (activeTab === 'USERS') {
        fetch(`${API_BASE}/api/admin/users${adminQuery}`)
            .then(r => r.json())
            .then(d => d.success ? setUsers(d.users) : console.error(d.message || 'Error fetching users'));
    }
    if (activeTab === 'CHARGES') fetch(`${API_BASE}/api/admin/charges`).then(r => r.json()).then(d => setCharges(d.charges));
    if (activeTab === 'EXCHANGES') fetch(`${API_BASE}/api/admin/exchanges`).then(r => r.json()).then(d => setExchanges(d.exchanges));
    if (activeTab === 'BETS') fetch(`${API_BASE}/api/admin/bets`).then(r => r.json()).then(d => setBets(d.bets));
  };

  // --- [기능] 경기 관리 (승부 조작) ---
  const handleScoreChange = (id: number, type: 'home' | 'away', val: string) => {
    setScores(prev => ({
        ...prev,
        [id]: { ...prev[id], [type]: val }
    }));
  };

  const endMatch = async (matchId: number, homeName: string, awayName: string) => {
    const score = scores[matchId] || { home: '0', away: '0' };
    const homeScore = parseInt(score.home || '0');
    const awayScore = parseInt(score.away || '0');

    if(!confirm(`[경기 종료 확인]\n\n${homeName} ${homeScore} : ${awayScore} ${awayName}\n\n이 결과로 확정하고 당첨자에게 머니를 지급하시겠습니까?`)) return;
    
    try {
        const res = await fetch('http://localhost:4000/api/admin/settle', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ matchId, homeScore, awayScore })
        });
        const data = await res.json();
        
        if (data.success) {
            alert('✅ 정산 완료! (당첨금 지급됨)'); 
            fetchData();
        } else {
            alert('정산 실패: ' + data.message);
        }
    } catch (e) {
        alert('서버 오류 발생');
    }
  };

  const resetMatch = async (matchId: number) => {
    if(!confirm('경기를 "경기 전(0:0)" 상태로 초기화하시겠습니까?\n(이미 지급된 머니는 회수되지 않습니다)')) return;
    
    try {
        await fetch('http://localhost:4000/api/admin/reset-match', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId })
        });
        alert('초기화 완료'); 
        fetchData(); 
    } catch (e) {
        alert('오류 발생');
    }
  };

  // --- [기능] 회원 관리 (지급 & 환수) ---
  const giveMoney = async (userId: string) => {
    const amount = prompt('💰 지급할 금액을 입력하세요:');
    if (!amount) return;
    await fetch('http://localhost:4000/api/admin/give-money', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId, amount })
    });
    alert('지급 완료'); fetchData();
  };

  const takeMoney = async (userId: string) => {
    const amount = prompt('💸 환수할(뺏을) 금액을 입력하세요:');
    if (!amount) return;
    await fetch('http://localhost:4000/api/admin/take-money', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId, amount })
    });
    alert('환수 완료'); fetchData();
  };

  // --- [기능] 충전/환전 승인 ---
  const approveCharge = async (chargeId: string) => {
    if (!confirm('입금 확인 하셨습니까? 승인하시겠습니까?')) return;
    await fetch('http://localhost:4000/api/admin/approve-charge', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chargeId })
    });
    alert('승인 완료'); fetchData();
  };

  const approveExchange = async (exchangeId: string) => {
    if (!confirm('송금 완료 하셨습니까?')) return;
    await fetch('http://localhost:4000/api/admin/approve-exchange', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ exchangeId })
    });
    alert('처리 완료'); fetchData();
  };


  if (!hasHydrated) return <div className="min-h-screen bg-[#12141e] flex items-center justify-center text-slate-500"><h1 className="text-xl font-bold animate-pulse">로딩 중...</h1></div>;

  if (!user || (user as any).role !== 'admin') return <div className="min-h-screen bg-[#12141e] flex items-center justify-center text-red-500 font-bold">접근 권한 없음</div>;

  return (
    <div className="min-h-screen bg-[#12141e] p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-500">ADMIN DASHBOARD</h1>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-sm text-slate-400">관리자 접속</p>
                <p className="text-white font-bold text-lg">{(user as any).nickname || (user as any).name} 님</p>
            </div>
            <button onClick={fetchData} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm h-10">🔄 새로고침</button>
        </div>
      </div>
      
      <div className="flex gap-4 mb-8 border-b border-slate-700 pb-4 overflow-x-auto">
        {['MATCHES', 'USERS', 'BETS', 'CHARGES', 'EXCHANGES'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg font-bold transition-all whitespace-nowrap 
                ${activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-[#1e2130] text-slate-400 hover:bg-[#2a2d3e]'}`}
          >
            {tab === 'MATCHES' ? '경기 관리 (승부조작)' : tab === 'USERS' ? '회원 관리' : tab === 'BETS' ? '배팅 내역' : tab === 'CHARGES' ? '충전 요청' : '환전 요청'}
          </button>
        ))}
      </div>

      {/* ================= 회원 관리 탭 ================= */}
      {activeTab === 'USERS' && (
        <div className="overflow-x-auto bg-[#1e2130] rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap">
            <thead className="bg-slate-800 text-xs uppercase text-slate-200">
              <tr>
                <th className="px-6 py-4">아이디</th>
                <th className="px-6 py-4">비밀번호</th>
                <th className="px-6 py-4">닉네임</th>
                <th className="px-6 py-4">이름(예금주)</th>
                {/* 전화번호 제거됨 */}
                <th className="px-6 py-4">계좌정보</th>
                <th className="px-6 py-4">보유머니</th>
                <th className="px-6 py-4 text-center">관리 (지급/환수)</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-slate-700 hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-bold text-white">{u.userid}</td>
                  <td className="px-6 py-4 text-red-300 font-mono select-all">{u.password || '****'}</td>
                  <td className="px-6 py-4">{u.nickname}</td>
                  <td className="px-6 py-4">{u.accountHolder || '-'}</td>
                  {/* 전화번호 칸 제거됨 */}
                  <td className="px-6 py-4 text-xs">
                    {u.bank ? (
                        <span className="text-emerald-400">{u.bank} | {u.accountNumber}</span>
                    ) : <span className="text-slate-600">미등록</span>}
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-mono text-lg font-bold">
                    {u.money?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => giveMoney(u.userid)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg shadow-blue-900/20">
                        + 지급
                        </button>
                        <button onClick={() => takeMoney(u.userid)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg shadow-red-900/20">
                        - 환수
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= 경기 관리 탭 ================= */}
      {activeTab === 'MATCHES' && (
        <div className="grid gap-4">
          {matches.map(m => (
            <div key={m.id} className="bg-[#1e2130] p-5 rounded-xl flex justify-between items-center border border-slate-700 hover:border-slate-500 transition-all shadow-lg">
               
               <div className="w-1/3">
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${m.status === 'FINISHED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                        {m.status === 'FINISHED' ? '종료됨' : '진행중/예정'}
                    </span>
                    <span className="text-xs text-slate-500">{m.date}</span>
                 </div>
                 <div className="text-lg font-bold">
                    <span className="text-white">{m.home}</span> 
                    <span className="text-slate-500 mx-2">vs</span> 
                    <span className="text-white">{m.away}</span>
                 </div>
                 <div className="text-xs text-slate-400 mt-1">
                    현재 스코어: {m.score.home} : {m.score.away}
                 </div>
               </div>
               
               <div className="flex items-center gap-4">
                  {m.status !== 'FINISHED' && (
                    <div className="flex items-center gap-2 bg-[#12141e] p-2 rounded-lg border border-slate-700">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 mb-1">HOME</span>
                            <input 
                                type="number" 
                                className="w-14 bg-slate-800 text-center text-white font-bold rounded py-1 border border-slate-600 focus:border-emerald-500 outline-none" 
                                value={scores[m.id]?.home ?? m.score.home}
                                onChange={(e)=>handleScoreChange(m.id, 'home', e.target.value)}
                            />
                        </div>
                        <span className="text-slate-500 font-bold">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 mb-1">AWAY</span>
                            <input 
                                type="number" 
                                className="w-14 bg-slate-800 text-center text-white font-bold rounded py-1 border border-slate-600 focus:border-emerald-500 outline-none" 
                                value={scores[m.id]?.away ?? m.score.away}
                                onChange={(e)=>handleScoreChange(m.id, 'away', e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => endMatch(m.id, m.home, m.away)} 
                            className="ml-3 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-900/30 transition-all"
                        >
                            결과 입력 (정산)
                        </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => resetMatch(m.id)} 
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    초기화
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= 배팅 내역 탭 ================= */}
      {activeTab === 'BETS' && (
        <div className="overflow-x-auto bg-[#1e2130] rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-800 text-xs uppercase text-slate-200">
              <tr>
                <th className="px-6 py-4">시간</th>
                <th className="px-6 py-4">닉네임</th>
                <th className="px-6 py-4">경기 정보</th>
                <th className="px-6 py-4">픽 (배당)</th>
                <th className="px-6 py-4">배팅금</th>
                <th className="px-6 py-4">당첨금 (예상)</th>
                <th className="px-6 py-4">결과</th>
              </tr>
            </thead>
            <tbody>
              {bets.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10">배팅 내역이 없습니다.</td></tr>
              ) : bets.map(b => (
                <tr key={b._id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-xs">{new Date(b.betTime).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 text-white font-bold">{b.nickname}</td>
                  <td className="px-6 py-4 text-slate-300">{b.matchInfo}</td>
                  <td className="px-6 py-4 font-bold">
                    <span className={b.pick === 'HOME' ? 'text-red-400' : b.pick === 'AWAY' ? 'text-blue-400' : 'text-slate-400'}>
                        {b.pick}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">({b.odds})</span>
                  </td>
                  <td className="px-6 py-4 text-white">{b.stake.toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-slate-300">
                    {Math.floor(b.stake * b.odds).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {b.status === 'WIN' && <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">적중</span>}
                    {b.status === 'LOSE' && <span className="text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded border border-red-500/20">미적중</span>}
                    {b.status === 'PENDING' && <span className="text-slate-400 bg-slate-700/30 px-2 py-1 rounded border border-slate-600">진행중</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= 충전 요청 탭 ================= */}
      {activeTab === 'CHARGES' && (
        <div className="grid gap-4">
          {charges.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                현재 들어온 충전 요청이 없습니다.
            </div>
          ) : charges.map(c => (
             <div key={c._id} className="bg-[#1e2130] p-6 rounded-xl flex justify-between items-center border border-slate-700 shadow-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-lg">{c.nickname}</span>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">충전신청</span>
                    </div>
                    <span className="text-emerald-400 font-black text-2xl">+{c.amount.toLocaleString()}원</span>
                    <div className="text-xs text-slate-500 mt-1">{new Date(c.requestTime).toLocaleString()}</div>
                </div>
                {c.status === 'PENDING' ? (
                    <button onClick={() => approveCharge(c._id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/20 animate-pulse transition-all">
                        입금 승인하기
                    </button>
                ) : (
                    <span className="text-slate-500 font-bold border border-slate-600 px-4 py-2 rounded-lg bg-slate-800">완료됨</span>
                )}
             </div>
          ))}
        </div>
      )}

      {/* ================= 환전 요청 탭 ================= */}
      {activeTab === 'EXCHANGES' && (
        <div className="grid gap-4">
          {exchanges.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                현재 들어온 환전 요청이 없습니다.
            </div>
          ) : exchanges.map(ex => (
             <div key={ex._id} className="bg-[#1e2130] p-6 rounded-xl flex justify-between items-center border border-slate-700 shadow-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-lg">{ex.nickname}</span>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">환전신청</span>
                    </div>
                    <span className="text-red-400 font-black text-2xl">-{ex.amount.toLocaleString()}원</span>
                    <div className="text-sm text-slate-300 mt-2 bg-slate-800 p-2 rounded border border-slate-700">
                        🏦 {ex.bank} <span className="mx-2">|</span> {ex.accountNumber}
                    </div>
                </div>
                {ex.status === 'PENDING' ? (
                    <button onClick={() => approveExchange(ex._id)} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-red-900/20 transition-all">
                        송금 확인 (승인)
                    </button>
                ) : (
                    <span className="text-slate-500 font-bold border border-slate-600 px-4 py-2 rounded-lg bg-slate-800">완료됨</span>
                )}
             </div>
          ))}
        </div>
      )}

    </div>
  );
}