'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  
  // ★ [추가됨] 로그인 유지 체크 여부 (기본값 true)
  const [keepLogin, setKeepLogin] = useState(true);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, password }), 
      });

      const data = await res.json();

      if (data.success) {
        if (!data.user) {
          setError('로그인은 성공했으나 회원 정보를 불러오지 못했습니다.');
          return;
        }

        // ★ [핵심 로직] 로그인 유지 설정에 따라 저장소 결정
        if (keepLogin) {
            // 체크됨 -> 로컬 스토리지 (브라우저 꺼도 남음)
            localStorage.setItem('userid', data.user.userid);
            sessionStorage.removeItem('userid'); // 혹시 모를 중복 제거
        } else {
            // 체크안함 -> 세션 스토리지 (새로고침은 되지만, 끄면 사라짐)
            sessionStorage.setItem('userid', data.user.userid);
            localStorage.removeItem('userid'); 
        }

        login(data.user);
        alert(`환영합니다, ${data.user.name}님!`);
        router.push('/'); 
      } else {
        setError(data.message || '아이디 또는 비밀번호를 확인해주세요.');
      }
    } catch (err) {
      console.error(err);
      setError('서버와 연결할 수 없습니다. 백엔드가 켜져 있는지 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#161925] p-4">
      <div className="w-full max-w-md bg-[#1e2130] p-8 rounded-2xl shadow-2xl border border-slate-700/50">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-white mb-2">
            SPORTS <span className="text-emerald-400">TOTO</span>
          </h1>
          <p className="text-slate-400 text-sm">EPL 승부예측의 모든 것</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">ID</label>
            <input 
              type="text" 
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {/* ★ [추가됨] 로그인 유지 체크박스 UI */}
          <div className="flex items-center">
            <input
              id="keep-login"
              type="checkbox"
              checked={keepLogin}
              onChange={(e) => setKeepLogin(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-[#161925] border-slate-600 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="keep-login" className="ml-2 text-sm text-slate-400 cursor-pointer select-none">
              로그인 상태 유지
            </label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all transform active:scale-95
              ${isLoading 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'}
            `}
          >
            {isLoading ? '로그인 중...' : '로그인 (LOGIN)'}
          </button>
        </form>

        <div className="mt-6 text-center text-slate-500 text-sm">
          계정이 없으신가요?{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-bold ml-1">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}