'use client';

import { useState, useEffect } from 'react';

export default function NoticePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    // 로컬스토리지 확인: 'hideNotice' 키에 오늘 날짜가 저장되어 있는지 체크
    const hideDate = localStorage.getItem('hideNotice');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

    if (hideDate !== today) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowToday) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('hideNotice', today);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1e2130] w-full max-w-[480px] rounded-xl shadow-2xl border border-slate-600 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 1. 헤더 */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 p-4 flex justify-between items-center shrink-0">
          <h2 className="text-white font-black italic text-xl tracking-wider flex items-center gap-2">
            📢 NOTICE
          </h2>
          <button onClick={() => setIsVisible(false)} className="text-white/80 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 2. 본문 (스크롤 가능) */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-white space-y-6">
          
          {/* 환영 인사 */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-emerald-400">SPORT TOTO 그랜드 오픈!</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              EPL 승부예측의 새로운 기준,<br/>
              SPORT TOTO에 오신 것을 환영합니다.<br/>
              회원님들의 성원에 힘입어 정식 오픈했습니다.
            </p>
          </div>

          {/* 🎁 이벤트 섹션 */}
          <div className="bg-[#161925] rounded-lg p-4 border border-slate-700">
            <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2 text-sm">
              🎁 신규 가입 파격 혜택
            </h4>
            <ul className="space-y-2 text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">✓</span>
                <span>가입 즉시 <b className="text-white">1,000 포인트</b> 무료 지급!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">✓</span>
                <span>첫 충전 시 보너스 포인트 <b className="text-white">5%</b> 추가 지급</span>
              </li>
            </ul>
          </div>

          {/* 📢 안내 사항 섹션 */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-l-4 border-emerald-500 pl-2">
              주요 이용 안내
            </h4>
            <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside pl-1">
              <li>
                <span className="text-slate-200 font-bold">베팅 취소:</span> 경기 시작 <span className="text-red-400 font-bold underline">15분 전까지만</span> 가능합니다.
              </li>
              <li>
                현재 <span className="text-white font-bold">EPL 경기 데이터</span>가 실시간으로 연동되고 있습니다.
              </li>
              <li>
                버그 제보나 피드백은 언제나 환영합니다. 즐거운 시간 되세요!
              </li>
            </ul>
          </div>

        </div>

        {/* 3. 경고 문구 (하단 고정) */}
        <div className="bg-[#12141e] p-4 border-t border-slate-700 shrink-0">
          <div className="text-[10px] text-slate-500 text-center leading-tight space-y-1">
            <p className="font-bold text-slate-400">도박 중독, 당신과 가정의 행복을 위협할 수 있습니다.</p>
            <p>본 사이트는 건전한 스포츠 베팅 문화를 지향합니다.</p>
            <p>청소년은 이용할 수 없으며, 타인의 개인정보 도용 가입은 불법입니다.</p>
            <p className="pt-1 text-emerald-600/70 font-bold">도박문제 상담전화: 1336</p>
          </div>
        </div>

        {/* 4. 푸터 (오늘 하루 보지 않기) */}
        <div className="bg-[#1e2130] p-3 flex justify-between items-center px-6 border-t border-slate-700 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group">
            <input 
              type="checkbox" 
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 cursor-pointer" 
            />
            <span className="text-xs text-slate-400 group-hover:text-slate-200">오늘 하루 보지 않기</span>
          </label>
          <button 
            onClick={handleClose} 
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}