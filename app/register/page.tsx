'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    userid: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    email: '', 
    bank: '',
    accountNumber: '',
    accountHolder: '',
    referralCode: ''
  });
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);       
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // [수정됨] 아이디 중복 확인 (4000번 포트로 요청)
  const checkId = async () => {
    if (!formData.userid) return alert('아이디를 입력해주세요.');
    if (formData.userid.length < 4) return alert('아이디는 4글자 이상이어야 합니다.');

    try {
      // ★ 여기가 수정되었습니다: /api -> http://localhost:4000/api
      const res = await fetch('http://localhost:4000/api/check/id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: formData.userid }),
      });
      const data = await res.json();
      
      if (data.available) {
        alert(data.message); 
      } else {
        alert(data.message);
        setFormData({ ...formData, userid: '' });
      }
    } catch (err) {
      alert('서버 연결 실패');
    }
  };

  // [수정됨] 닉네임 중복 확인
  const checkNickname = async () => {
    if (!formData.nickname) return alert('닉네임을 입력해주세요.');

    const koreanRegex = /^[가-힣]+$/;
    if (!koreanRegex.test(formData.nickname)) {
        setFormData({ ...formData, nickname: '' });
        return alert('닉네임은 순수 한글로만 입력해주세요. (영어, 숫자, 자음 불가)');
    }

    if (formData.nickname.length > 4) {
        return alert('닉네임은 최대 4글자까지만 가능합니다.');
    }

    try {
      // ★ 수정됨: 4000번 포트 명시
      const res = await fetch('http://localhost:4000/api/check/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: formData.nickname }),
      });
      const data = await res.json();

      if (data.available) {
        alert(data.message);
      } else {
        alert(data.message);
        setFormData({ ...formData, nickname: '' });
      }
    } catch (err) {
      alert('서버 연결 실패');
    }
  };

  // [수정됨] 이메일 발송
  const handleSendEmail = async () => {
    if (!formData.email) return alert('이메일을 입력해주세요.');
    if (!formData.email.includes('@')) return alert('올바른 이메일 형식이 아닙니다.');
    
    setIsLoading(true);
    try {
      // ★ 수정됨
      const res = await fetch('http://localhost:4000/api/auth/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      
      if (data.success) {
        alert('인증번호가 발송되었습니다. ( 메일을 확인 해주세요. )');
        setIsEmailSent(true);
        setIsEmailVerified(false);
      } else {
        alert('발송 실패: ' + data.message);
      }
    } catch (err) {
      alert('서버 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // [수정됨] 이메일 인증 확인
  const handleVerifyEmail = async () => {
    if (!verificationCode) return alert('인증번호를 입력해주세요.');

    try {
      // ★ 수정됨
      const res = await fetch('http://localhost:4000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });
      const data = await res.json();
      
      if (data.success) {
        alert('이메일 인증이 완료되었습니다.');
        setIsEmailVerified(true);
      } else {
        alert('인증번호가 틀렸습니다.');
      }
    } catch (err) {
      alert('서버 오류');
    }
  };

  // [수정됨] 회원가입 제출
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
    }
    if (!isEmailVerified) {
        setError('이메일 인증을 완료해주세요.'); 
        return;
    }
    
    const koreanRegex = /^[가-힣]+$/;
    if (!koreanRegex.test(formData.nickname) || formData.nickname.length > 4) {
        setError('닉네임은 한글 1~4글자여야 합니다.');
        return;
    }
    
    setIsLoading(true);

    try {
      // ★ 수정됨: 4000번 포트로 가입 요청
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        alert('회원가입 완료! 로그인해주세요.');
        router.push('/login'); 
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('서버 연결 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#161925] border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600";
  const labelClass = "block text-slate-400 text-xs font-bold mb-1.5 ml-1";
  const buttonClass = "bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 rounded-lg transition-all whitespace-nowrap h-[46px] border border-emerald-500/50 shadow-lg shadow-emerald-500/20";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#12141e] p-4 overflow-y-auto py-10">
      <div className="w-full max-w-2xl bg-[#1e2130] p-8 rounded-2xl shadow-2xl border border-slate-700/50 relative">
        <Link href="/" className="absolute top-6 right-6 text-slate-500 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></Link>

        <div className="mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-2xl font-bold text-white">회원가입</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          
          {/* 1. 아이디 */}
          <div>
            <label className={labelClass}>아이디 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input type="text" name="userid" value={formData.userid} onChange={handleChange} className={inputClass} placeholder="아이디 입력" />
              <button type="button" onClick={checkId} className={buttonClass}>중복확인</button> 
            </div>
          </div>

          {/* 2. 비밀번호 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>비밀번호</label><input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>비밀번호 확인</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputClass} /></div>
          </div>

          {/* 3. 닉네임 */}
          <div>
            <label className={labelClass}>닉네임 (한글 4글자 제한) <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input 
                type="text" 
                name="nickname" 
                maxLength={4} 
                value={formData.nickname} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="한글 닉네임 (최대 4자)" 
              />
              <button type="button" onClick={checkNickname} className={buttonClass}>중복확인</button>
            </div>
          </div>

          {/* 4. 이메일 인증 */}
          <div>
            <label className={labelClass}>이메일 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly={isEmailVerified}
                className={`${inputClass} ${isEmailVerified ? 'bg-slate-800 text-slate-500' : ''}`}
                placeholder="이메일 주소를 입력해주세요"
              />
              <button 
                type="button" 
                onClick={handleSendEmail}
                disabled={isEmailVerified || isLoading}
                className={`${buttonClass} ${isEmailVerified ? 'bg-slate-600 border-slate-600' : 'bg-orange-600 hover:bg-orange-500 border-orange-500/50'}`}
              >
                {isLoading ? '발송중..' : (isEmailVerified ? '인증완료' : '인증번호발송')}
              </button>
            </div>

            {isEmailSent && !isEmailVerified && (
              <div className="flex gap-2 animate-fadeIn mt-2">
                <input 
                  type="text" 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className={inputClass}
                  placeholder="인증번호 6자리 입력"
                />
                <button type="button" onClick={handleVerifyEmail} className={buttonClass}>확인</button>
              </div>
            )}
          </div>

          {/* 5. 은행 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>은행명</label>
              <select name="bank" value={formData.bank} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                <option value="">선택해주세요</option>
                <option value="kb">KB국민은행</option>
                <option value="shinhan">신한은행</option>
                <option value="woori">우리은행</option>
                <option value="hana">하나은행</option>
                <option value="nh">NH농협은행</option>
                <option value="ibk">IBK기업은행</option>
                <option value="kakao">카카오뱅크</option>
                <option value="toss">토스뱅크</option>
                <option value="sc">SC제일은행</option>
                <option value="busan">부산은행</option>
                <option value="keb">외환은행</option>
                <option value="gwangju">광주은행</option>
                <option value="gyeongnam">경남은행</option>
                <option value="daegu">대구은행</option>
                <option value="post">우체국</option>
                <option value="suhyup">수협은행</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>계좌번호</label>
              <input 
                type="text" 
                name="accountNumber" 
                value={formData.accountNumber} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="계좌번호를 입력해주세요 (- 없이)" 
              />
            </div>
          </div>
          
          {/* 6. 예금주 & 가입코드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>예금주(한글만) <span className="text-red-500">*</span></label>
              <input type="text" name="accountHolder" value={formData.accountHolder} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>가입코드</label>
              <input type="text" name="referralCode" value={formData.referralCode} onChange={handleChange} className={inputClass} />
              <p className="text-[10px] text-orange-400 mt-1 ml-1">[ 가입코드가 없는경우 "000" 를 입력해주세요 ]</p>
            </div>
          </div>

          {error && <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg text-center mt-4">{error}</div>}

          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg py-4 rounded-xl mt-6">회원가입 완료</button>
        </form>
      </div>
    </div>
  );
}