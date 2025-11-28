// utils/oddsSystem.ts

interface Odds {
  home: number;
  draw: number;
  away: number;
}

/**
 * 현재 스코어에 따라 배당률을 재계산하는 함수
 * (홈팀이 이기고 있으면 홈 배당 하락 / 지고 있으면 홈 배당 상승)
 */
export const calculateLiveOdds = (initialOdds: Odds, homeScore: number, awayScore: number): Odds => {
  const scoreDiff = homeScore - awayScore; // 점수 차 (양수면 홈팀 리드, 음수면 원정팀 리드)
  
  // 배당률 변동 계수 (골당 30%~50% 정도 변동하도록 설정)
  let homeFactor = 1.0;
  let drawFactor = 1.0;
  let awayFactor = 1.0;

  if (scoreDiff > 0) {
    // 홈팀이 이기고 있을 때
    // 예: 1점차 -> 0.7배, 2점차 -> 0.5배 (배당 하락 = 당첨 확률 상승)
    homeFactor = Math.pow(0.7, scoreDiff); 
    drawFactor = 1.0 + (scoreDiff * 0.5); // 무승부 확률은 낮아짐 (배당 상승)
    awayFactor = 1.0 + (scoreDiff * 0.8); // 원정승 확률은 급격히 낮아짐 (배당 급상승)
  } else if (scoreDiff < 0) {
    // 원정팀이 이기고 있을 때
    const absDiff = Math.abs(scoreDiff);
    homeFactor = 1.0 + (absDiff * 0.8);
    drawFactor = 1.0 + (absDiff * 0.5);
    awayFactor = Math.pow(0.7, absDiff);
  } else {
    // 동점일 때 (시간이 지날수록 무승부 배당은 떨어져야 하지만, 여기서는 초기값 유지에 약간의 변동만)
    // 무승부 상황에서는 무승부 배당이 조금씩 떨어지는 게 현실적
    drawFactor = 0.95; 
  }

  // 랜덤 노이즈 추가 (주식처럼 살짝씩 움직이게 함: -1% ~ +1%)
  const noise = () => 1 + (Math.random() * 0.02 - 0.01);

  return {
    home: parseFloat(Math.max(1.01, initialOdds.home * homeFactor * noise()).toFixed(2)),
    draw: parseFloat(Math.max(1.01, initialOdds.draw * drawFactor * noise()).toFixed(2)),
    away: parseFloat(Math.max(1.01, initialOdds.away * awayFactor * noise()).toFixed(2)),
  };
};