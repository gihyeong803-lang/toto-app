'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore'; 
import { useRouter } from 'next/navigation';

// =========================================================================================
// [오류 수정] Bet 인터페이스에 nickname 속성 추가
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

interface BetItem {
    matchId: number;
    pick: string; 
    odds: number;
    matchName?: string; 
}

interface Bet { 
    _id: string; 
    userId: string;
    userInfo?: { nickname: string; name: string }; 
    
    // ★ [수정됨] 여기에 nickname을 추가해서 오류를 해결했습니다!
    nickname?: string; 
    
    matchInfo: string; 
    pick: string; 
    items?: BetItem[];
    stake: number; 
    odds: number; 
    status: string; 
    betTime: string; 
    matchName?: string;
}

export default function AdminPage() {
  const { user, hasHydrated } = useAuthStore(); 
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('BETS'); 
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [bets, setBets] = useState<Bet[]>([]); 
  
  const [scores, setScores] = useState<{ [key: number]: { home: string, away: string } }>({}); 

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace('/login'); return; }
    if ((user as any).role !== 'admin') {
        alert("관리자만 접근할 수 있는 페이지입니다.");
        router.replace('/'); return;
    }
    fetchData();
  }, [user, router, hasHydrated]); 

  useEffect(() => {
    if (user && hasHydrated && (user as any).role === 'admin') fetchData();
  }, [activeTab]);

  const fetchData = () => {
    if (!user) return;
    // 배포된 Render 주소 사용
    const API_BASE = 'https://toto-server-f4j2.onrender.com'; 
    const adminQuery = `?userid=${(user as any).userid}`;

    if (activeTab === 'MATCHES') fetch(`${API_BASE}/api/matches`).then(r => r.json()).then(setMatches);
    if (activeTab === 'USERS') fetch(`${API_BASE}/api/admin/users${adminQuery}`).then(r => r.json()).then(d => setUsers(d.users));
    if (activeTab === 'CHARGES') fetch(`${API_BASE}/api/admin/charges`).then(r => r.json()).then(d => setCharges(d.charges));
    if (activeTab === 'EXCHANGES') fetch(`${API_BASE}/api/admin/exchanges`).then(r => r.json()).then(d => setExchanges(d.exchanges));
    if (activeTab === 'BETS') fetch(`${API_BASE}/api/admin/bets`).then(r => r.json()).then(d => setBets(d.bets));
  };

  // --- 경기 관리 ---
  const handleScoreChange = (id: number, type: 'home' | 'away', val: string) => {
    setScores(prev => ({ ...prev, [id]: { ...prev[id], [type]: val } }));
  };
  const endMatch = async (matchId: number, homeName: string, awayName: string) => {
    const score = scores[matchId] || { home: '0', away: '0' };
    if(!confirm(`[경기 종료]\n${homeName} ${score.home} : ${score.away} ${awayName}\n정산하시겠습니까?`)) return;
    await fetch('https://toto-server-f4j2.onrender.com/api/admin/settle', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ matchId, homeScore: parseInt(score.home), awayScore: parseInt(score.away) })
    });
    alert('정산 완료'); fetchData();
  };
  const resetMatch = async (matchId: number) => {
    if(!confirm('초기화하시겠습니까?')) return;
    await fetch('https://toto-server-f4j2.onrender.com/api/admin/reset-match', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
    });
    alert('초기화 완료'); fetchData(); 
  };

  // --- 회원 관리 ---
  const giveMoney = async (userId: string) => {
    const amount = prompt('지급액:'); if(!amount) return;
    await fetch('https://toto-server-f4j2.onrender.com/api/admin/give-money', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId, amount })
    });
    alert('지급 완료'); fetchData();
  };
  const takeMoney = async (userId: string) => {
    const amount = prompt('환수액:'); if(!amount) return;
    await fetch('https://toto-server-f4j2.onrender.com/api/admin/take-money', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId, amount })
    });
    alert('환수 완료'); fetchData();
  };

  // --- 승인 기능 ---
  const approveCharge = async (chargeId: string) => {
    if(!confirm('승인하시겠습니까?')) return;
    await fetch('https://toto-server-f4j2.onrender.com/api/admin/approve-charge', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ chargeId })
    });
    alert('승인 완료'); fetchData();
  };
  const approveExchange = async (exchangeId: string) => {
    if(!confirm('승인하시겠습니까?')) return;
    await fetch('https://toto-server-f4j2.onrender.com/api/admin/approve-exchange', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ exchangeId })
    });
    alert('처리 완료'); fetchData();
  };

  const renderPick = (pick: string) => {
    if (pick === 'HOME') return <span className="text-red-400 font-bold">승</span>;
    if (pick === 'AWAY') return <span className="text-blue-400 font-bold">패</span>;
    return <span className="text-emerald-400 font-bold">무</span>;
  };

  if (!hasHydrated || !user) return <div className="min-h-screen bg-[#12141e] text-white flex items-center justify-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#12141e] p-4 md:p-8 text-white">
      
      {/* 모바일 헤더 최적화 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-red-500">ADMIN DASHBOARD</h1>
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end bg-[#1e2130] p-2 md:p-0 rounded-lg md:bg-transparent">
            <div className="text-right">
                <span className="text-xs text-slate-400 block md:hidden">관리자</span>
                <span className="font-bold text-sm md:text-lg">{(user as any).nickname} 님</span>
            </div>
            <button onClick={fetchData} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-xs md:text-sm font-bold whitespace-nowrap">
                🔄 새로고침
            </button>
        </div>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {['BETS', 'USERS', 'MATCHES', 'CHARGES', 'EXCHANGES'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap text-sm flex-shrink-0 
                ${activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-[#1e2130] text-slate-400 hover:bg-[#2a2d3e]'}`}>
            {tab === 'BETS' ? '배팅 내역' : tab === 'USERS' ? '회원 관리' : tab === 'MATCHES' ? '경기 관리' : tab === 'CHARGES' ? '충전 요청' : '환전 요청'}
          </button>
        ))}
      </div>

      {/* ================= 배팅 내역 탭 ================= */}
      {activeTab === 'BETS' && (
        <div className="bg-[#1e2130] rounded-lg border border-slate-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800 text-xs uppercase text-slate-200">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">시간</th>
                  <th className="px-4 py-3 whitespace-nowrap">유저 (실명)</th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">타입</th>
                  <th className="px-4 py-3 min-w-[200px]">경기 정보</th>
                  <th className="px-4 py-3 whitespace-nowrap">픽 (배당)</th>
                  <th className="px-4 py-3 whitespace-nowrap">배팅금</th>
                  <th className="px-4 py-3 whitespace-nowrap">당첨금 (예상)</th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">결과</th>
                </tr>
              </thead>
              <tbody>
                {bets.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10">배팅 내역이 없습니다.</td></tr>
                ) : bets.map(b => {
                  const isMulti = b.items && b.items.length > 1;
                  // 오류 해결 부분: 이제 b.nickname을 써도 에러가 안 납니다.
                  const nickname = b.userInfo?.nickname || b.nickname || '알수없음';
                  const realName = b.userInfo?.name || '-';

                  return (
                    <tr key={b._id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-xs whitespace-nowrap font-mono">
                          {new Date(b.betTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-white text-sm">{nickname}</div>
                          <div className="text-xs text-slate-500">({realName})</div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-center">
                              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-bold">일반</span>
                              {isMulti ? 
                                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded font-bold">{b.items?.length}폴더</span> :
                                  <span className="bg-slate-700 text-slate-400 text-[10px] px-2 py-0.5 rounded">단폴더</span>
                              }
                          </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                          {isMulti ? (
                              <div className="space-y-1.5 min-w-[200px]">
                                  {b.items?.map((item, i) => {
                                      const match = matches.find(m => m.id === item.matchId);
                                      const matchName = match ? `${match.home} vs ${match.away}` : `Match ${item.matchId}`;
                                      return <div key={i} className="text-xs flex items-center gap-1"><span className="text-slate-500 font-bold">{i+1}.</span> {matchName}</div>
                                  })}
                              </div>
                          ) : (
                              <span className="font-bold text-sm whitespace-nowrap">{b.matchName || b.matchInfo}</span>
                          )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                          {isMulti ? (
                              <div className="space-y-1.5">
                                  {b.items?.map((item, i) => (
                                      <div key={i} className="text-xs flex items-center gap-1">
                                          {renderPick(item.pick)} <span className="text-slate-500 font-mono">({item.odds})</span>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="font-bold flex items-center gap-1 text-sm">
                                  {renderPick(b.pick)} <span className="text-slate-500 font-mono">({b.odds})</span>
                              </div>
                          )}
                      </td>
                      <td className="px-4 py-3 text-white font-mono font-bold whitespace-nowrap">
                          {b.stake.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400 font-bold whitespace-nowrap">
                          {Math.floor(b.stake * b.odds).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                          {b.status === 'WIN' && <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-1 rounded text-xs font-bold">적중</span>}
                          {b.status === 'LOSE' && <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-1 rounded text-xs font-bold">미적중</span>}
                          {b.status === 'PENDING' && <span className="bg-slate-700/50 text-slate-300 border border-slate-600 px-2 py-1 rounded text-xs font-bold">진행중</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- 회원 관리 --- */}
      {activeTab === 'USERS' && (
        <div className="bg-[#1e2130] rounded-lg border border-slate-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap">
              <thead className="bg-slate-800 text-xs uppercase text-slate-200">
                <tr>
                  <th className="px-4 py-3">아이디</th>
                  <th className="px-4 py-3">비밀번호</th>
                  <th className="px-4 py-3">닉네임</th>
                  <th className="px-4 py-3">예금주</th>
                  <th className="px-4 py-3">계좌정보</th>
                  <th className="px-4 py-3">보유머니</th>
                  <th className="px-4 py-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-slate-700 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white font-bold">{u.userid}</td>
                    <td className="px-4 py-3 text-red-300 font-mono select-all">{u.password}</td>
                    <td className="px-4 py-3">{u.nickname}</td>
                    <td className="px-4 py-3">{u.accountHolder || '-'}</td>
                    <td className="px-4 py-3 text-xs">
                      {u.bank ? <span className="text-emerald-400">{u.bank} | {u.accountNumber}</span> : <span className="text-slate-600">미등록</span>}
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-mono text-lg font-bold">
                      {u.money?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => giveMoney(u.userid)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-xs text-white font-bold whitespace-nowrap">지급</button>
                        <button onClick={() => takeMoney(u.userid)} className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-xs text-white font-bold whitespace-nowrap">환수</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- 경기 관리 --- */}
      {activeTab === 'MATCHES' && (
        <div className="grid gap-4">
          {matches.map(m => (
            <div key={m.id} className="bg-[#1e2130] p-4 rounded-xl flex flex-col md:flex-row justify-between items-center border border-slate-700 gap-4">
               <div className="w-full md:w-1/3 text-center md:text-left">
                 <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${m.status==='FINISHED'?'bg-red-900 text-red-300':'bg-green-900 text-green-300'}`}>{m.status}</span>
                 <div className="font-bold mt-1 text-sm md:text-base">{m.home} vs {m.away}</div>
                 <div className="text-xs text-slate-500">{m.score.home} : {m.score.away}</div>
               </div>
               {m.status !== 'FINISHED' && (
                 <div className="flex gap-2 w-full md:w-auto justify-center">
                    <input type="number" className="w-10 bg-slate-800 text-center text-white rounded border border-slate-600" onChange={(e)=>handleScoreChange(m.id,'home',e.target.value)} placeholder={m.score.home.toString()} />
                    <span className="text-slate-500">:</span>
                    <input type="number" className="w-10 bg-slate-800 text-center text-white rounded border border-slate-600" onChange={(e)=>handleScoreChange(m.id,'away',e.target.value)} placeholder={m.score.away.toString()} />
                    <button onClick={()=>endMatch(m.id,m.home,m.away)} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold whitespace-nowrap">종료</button>
                 </div>
               )}
               <button onClick={()=>resetMatch(m.id)} className="bg-slate-700 text-xs px-3 py-1 rounded w-full md:w-auto">초기화</button>
            </div>
          ))}
        </div>
      )}

      {/* --- 충전/환전 --- */}
      {activeTab === 'CHARGES' && charges.map(c => (
         <div key={c._id} className="bg-[#1e2130] p-4 mb-2 rounded-lg border border-slate-700 flex justify-between items-center shadow-md">
            <div>
                <span className="font-bold text-white">{c.nickname}</span> 
                <span className="text-emerald-400 ml-2 font-bold text-lg">+{c.amount.toLocaleString()}</span> 
                <div className="text-xs text-slate-500 mt-1">{new Date(c.requestTime).toLocaleString()}</div>
            </div>
            {c.status==='PENDING' ? <button onClick={()=>approveCharge(c._id)} className="bg-emerald-600 px-4 py-2 rounded text-sm font-bold text-white shadow-lg">승인</button> : <span className="text-slate-500 bg-slate-800 px-3 py-1 rounded text-xs">완료됨</span>}
         </div>
      ))}
      {activeTab === 'EXCHANGES' && exchanges.map(ex => (
         <div key={ex._id} className="bg-[#1e2130] p-4 mb-2 rounded-lg border border-slate-700 flex justify-between items-center shadow-md">
            <div>
                <span className="font-bold text-white">{ex.nickname}</span> 
                <span className="text-red-400 ml-2 font-bold text-lg">-{ex.amount.toLocaleString()}</span> 
                <div className="text-xs text-slate-500 mt-1">{ex.bank} {ex.accountNumber}</div>
            </div>
            {ex.status==='PENDING' ? <button onClick={()=>approveExchange(ex._id)} className="bg-red-600 px-4 py-2 rounded text-sm font-bold text-white shadow-lg">승인</button> : <span className="text-slate-500 bg-slate-800 px-3 py-1 rounded text-xs">완료됨</span>}
         </div>
      ))}
    </div>
  );
}