const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// ==================================================================
// [설정 1] MongoDB 주소
const MONGO_URI = 'mongodb+srv://admin:project1234!@cluster0.tezppjm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// [설정 2] 축구 API 키
const API_KEY = 'c3aa2808a3564ef19e2deec6f8badb0d';

// [설정 3] 이메일 설정
const EMAIL_USER = '9ccb58001@smtp-brevo.com'; 
const EMAIL_PASS = 'xsmtpsib-f3e7a2e564d5906fca6c1a24ece17dc8d9cb2cd64c09d528e0e52c9c3ea08e3d-SkvYeAd4S0LNksHh'; 

// [설정 4] 관리자 수익률 설정 (0.85 = 85% 환급)
const PAYOUT_RATE = 0.85; 

// [설정 5] ★ 전력 분석 및 시뮬레이션 데이터 저장소
let TEAM_POWER = {}; // 팀별 전력 점수 (0~100)
let SIMULATION_RESULTS = []; // 우승 확률 시뮬레이션 결과
// ==================================================================

const BASE_URL = 'https://api.football-data.org/v4';
const LEAGUE_CODE = 'PL';

// --- [DB 연결] ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

let verificationStore = {}; 


// ================= [스키마 정의] =================

const UserSchema = new mongoose.Schema({
    userid: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    bank: { type: String },
    accountNumber: { type: String },
    accountHolder: { type: String },
    money: { type: Number, default: 1000 }, 
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user'          
    },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const BetSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    matchId: { type: Number }, 
    pick: { type: String },    
    items: [{
        matchId: Number,
        pick: String,
        odds: Number
    }],
    stake: { type: Number, required: true },
    odds: { type: Number, required: true },
    status: { type: String, default: 'PENDING' },
    matchName: { type: String },
    betTime: { type: Date, default: Date.now }
});
const Bet = mongoose.model('Bet', BetSchema);

const MatchSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    league: String,
    home: String,
    away: String,
    date: String,
    time: String,
    status: String,
    score: { home: Number, away: Number },
    odds: { home: Number, draw: Number, away: Number },
    isSettled: { type: Boolean, default: false }
});
const Match = mongoose.model('Match', MatchSchema);

const ChargeSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    nickname: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'PENDING' },
    requestTime: { type: Date, default: Date.now }
});
const Charge = mongoose.model('Charge', ChargeSchema);

const ExchangeSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    nickname: { type: String, required: true },
    amount: { type: Number, required: true },
    bank: String,
    accountNumber: String,
    status: { type: String, default: 'PENDING' },
    requestTime: { type: Date, default: Date.now }
});
const Exchange = mongoose.model('Exchange', ExchangeSchema);

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', 
    port: 587,
    secure: false, 
    auth: { 
        user: EMAIL_USER, 
        pass: EMAIL_PASS 
    },
    tls: {
        rejectUnauthorized: false 
    }
});
// ================= [핵심 로직: 슈퍼컴퓨터 엔진] =================

// 1. [분석] API 순위 및 최근 전적 기반 팀 전력(Power) 계산
const fetchTeamFormAndPredict = async () => {
    try {
        console.log('📊 [Analysis] API 순위 및 최근 전적 분석 중...');
        const response = await axios.get(`${BASE_URL}/competitions/${LEAGUE_CODE}/standings`, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        const standings = response.data.standings[0].table;
        
        if (standings && standings.length > 0) {
            const newPowerRatings = {};
            
            standings.forEach((row) => {
                // 기본 전력: 현재 순위가 높을수록 강함 (1위=100점 근처)
                let basePower = 100 - (row.position * 2.5);
                
                // 최근 5경기 폼(Form) 반영
                // 예: "W,W,L,D,W" -> 승리 시 가산점 대폭 부여
                let formBonus = 0;
                if (row.form) {
                    const forms = row.form.split(','); 
                    forms.forEach(result => {
                        if (result === 'W') formBonus += 3; // 승리 시 +3점 (상승세)
                        if (result === 'D') formBonus += 1; // 무승부 +1점
                        if (result === 'L') formBonus -= 2; // 패배 시 -2점 (하락세)
                    });
                }
                newPowerRatings[row.team.name] = basePower + formBonus;
            });
            
            TEAM_POWER = newPowerRatings;
            console.log('✅ [Analysis] 전력 분석 완료. 시뮬레이션 엔진 가동!');
            
            // 전력 분석이 끝나면 바로 시뮬레이션 실행
            runMonteCarloSimulation(standings);
        }
    } catch (error) {
        console.error('⚠️ [Analysis] 분석 실패:', error.message);
    }
};

// 2. [예측] 몬테카를로 시뮬레이션 (시즌 1,000회 가상 진행)
const runMonteCarloSimulation = (standingsData) => {
    console.log('💻 [SuperComputer] 시즌 시뮬레이션 1,000회 수행 중...');
    
    const teams = standingsData.map(t => ({
        name: t.team.name,
        currentPoints: t.points,
        power: TEAM_POWER[t.team.name] || 50,
        playedGames: t.playedGames,
        rankCounts: Array(20).fill(0) // 1위~20위 횟수 저장
    }));

    const SIMULATION_COUNT = 1000;

    for (let i = 0; i < SIMULATION_COUNT; i++) {
        // 각 시뮬레이션마다 '최종 예상 승점' 계산
        const simulatedSeason = teams.map(team => {
            const remainingGames = 38 - team.playedGames;
            let addedPoints = 0;
            
            // 남은 경기 수만큼 가상 대결
            for (let g = 0; g < remainingGames; g++) {
                // 전력(Power) + 랜덤 변수(운)
                const performance = (Math.random() * 100) + (team.power * 0.6); 
                if (performance > 95) addedPoints += 3; // 승리
                else if (performance > 65) addedPoints += 1; // 무승부
            }

            return {
                name: team.name,
                finalPoints: team.currentPoints + addedPoints
            };
        });

        // 예상 승점 순으로 정렬
        simulatedSeason.sort((a, b) => b.finalPoints - a.finalPoints);

        // 순위 기록
        simulatedSeason.forEach((t, index) => {
            const originalTeam = teams.find(team => team.name === t.name);
            if (originalTeam) originalTeam.rankCounts[index]++;
        });
    }

    // 확률(%) 변환 및 저장
    const finalResults = teams.map(team => {
        const probabilities = team.rankCounts.map(count => {
            return parseFloat(((count / SIMULATION_COUNT) * 100).toFixed(1));
        });

        return {
            team: team.name,
            power: Math.floor(team.power),
            probabilities: probabilities // [1위확률, ..., 20위확률]
        };
    });

    // 우승 확률 높은 순 정렬
    finalResults.sort((a, b) => b.probabilities[0] - a.probabilities[0]);
    SIMULATION_RESULTS = finalResults;
    
    console.log('🚀 [SuperComputer] 예측 데이터 생성 완료! (우승 유력:', finalResults[0]?.team, ')');
};

// 3. [배당] 전력 기반 배당률 생성기
const generateMockOdds = (homeName, awayName, homeScore = 0, awayScore = 0) => {
    // 분석된 전력 점수 가져오기 (없으면 기본 50)
    const homePower = TEAM_POWER[homeName] || 50;
    const awayPower = TEAM_POWER[awayName] || 50;

    // 전력 차이에 따른 기본 배당 설정
    const powerDiff = homePower - awayPower; 
    const adjustedDiff = powerDiff + 5; // 홈 이점 +5점

    // 공식: 전력 차이가 클수록 정배/역배 차이 벌어짐
    let baseHome = 2.5 - (adjustedDiff * 0.04);
    let baseAway = 2.5 + (adjustedDiff * 0.04);
    let baseDraw = 3.3 - (Math.abs(adjustedDiff) * 0.01);

    // 실시간 스코어 반영 (점수 나면 배당 급변)
    const scoreDiff = homeScore - awayScore;

    if (scoreDiff > 0) { 
        baseHome -= (scoreDiff * 0.5); 
        baseAway += (scoreDiff * 2.5);
        baseDraw += (scoreDiff * 1.0);
    } else if (scoreDiff < 0) {
        baseHome += (Math.abs(scoreDiff) * 2.5);
        baseAway -= (Math.abs(scoreDiff) * 0.5);
        baseDraw += (Math.abs(scoreDiff) * 1.0);
    }
    
    // 배당 안전장치
    if (baseHome < 1.01) baseHome = 1.01;
    if (baseAway < 1.01) baseAway = 1.01;
    if (baseDraw < 1.01) baseDraw = 1.01;

    // 관리자 수익률 적용
    return {
        home: parseFloat((baseHome * PAYOUT_RATE).toFixed(2)),
        draw: parseFloat((baseDraw * PAYOUT_RATE).toFixed(2)),
        away: parseFloat((baseAway * PAYOUT_RATE).toFixed(2)),
    };
};


// --- [데이터 동기화] ---
const fetchFixtures = async () => {
    try {
        console.log('[System] 경기 데이터 동기화 중...');
        const today = new Date();
        const dateFrom = new Date(today); dateFrom.setDate(today.getDate() - 1);
        const dateTo = new Date(today); dateTo.setDate(today.getDate() + 14);

        const response = await axios.get(`${BASE_URL}/competitions/${LEAGUE_CODE}/matches`, {
            headers: { 'X-Auth-Token': API_KEY },
            params: {
                dateFrom: dateFrom.toISOString().split('T')[0],
                dateTo: dateTo.toISOString().split('T')[0]
            }
        });

        const apiMatches = response.data.matches;
        if (!apiMatches) return;

        for (const apiMatch of apiMatches) {
            const existingMatch = await Match.findOne({ id: apiMatch.id });
            if (existingMatch && existingMatch.isSettled) continue;

            const homeScore = apiMatch.score.fullTime.home ?? 0;
            const awayScore = apiMatch.score.fullTime.away ?? 0;

            const matchData = {
                id: apiMatch.id,
                league: 'Premier League',
                home: apiMatch.homeTeam.name,
                away: apiMatch.awayTeam.name,
                date: new Date(apiMatch.utcDate).toLocaleDateString(),
                time: new Date(apiMatch.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: apiMatch.status,
                score: { home: homeScore, away: awayScore },
                // ★ 업그레이드된 배당률 생성기 사용
                odds: generateMockOdds(
                    apiMatch.homeTeam.name, 
                    apiMatch.awayTeam.name,
                    homeScore,
                    awayScore
                )
            };

            await Match.findOneAndUpdate({ id: apiMatch.id }, matchData, { upsert: true, new: true });
        }
        console.log(`[System] 경기 데이터 업데이트 완료.`);
    } catch (error) {
        console.error('[Error] API Fetch:', error.message);
    }
};

// ==================================================================
// [수정됨] 정산 로직 (다폴더 완벽 지원: 하나라도 틀리면 미적중)
// ==================================================================
const settleMatchLogic = async (matchId, homeScore, awayScore) => {
    // 1. 현재 경기 정보 업데이트
    const match = await Match.findOne({ id: matchId });
    if (!match || match.isSettled) return;

    match.score = { home: homeScore, away: awayScore };
    match.status = 'FINISHED';
    
    // 현재 경기의 승패 결과 계산
    let currentMatchResult = 'DRAW';
    if (homeScore > awayScore) currentMatchResult = 'HOME';
    if (homeScore < awayScore) currentMatchResult = 'AWAY';

    console.log(`\n🏆 [정산 시작] Match ${match.id} 결과: ${currentMatchResult}`);
    
    // 이 경기를 포함한 모든 '대기중(PENDING)' 배팅 내역을 찾음 (단폴 + 다폴 모두)
    const pendingBets = await Bet.find({ 
        status: 'PENDING',
        $or: [
            { matchId: match.id },          // 단폴더일 경우
            { "items.matchId": match.id }   // 다폴더일 경우
        ]
    });

    for (const bet of pendingBets) {
        let isFail = false;       // 하나라도 틀렸는지 체크
        let isAllFinished = true; // 모든 경기가 끝났는지 체크

        // -------------------------------------------------------
        // Case A: 다폴더 (items 배열이 있는 경우)
        // -------------------------------------------------------
        if (bet.items && bet.items.length > 0) {
            for (const item of bet.items) {
                // 검사할 경기가 '방금 끝난 그 경기'라면 DB 조회 없이 바로 결과 사용
                let targetStatus = 'FINISHED';
                let targetHome = 0;
                let targetAway = 0;

                if (item.matchId === match.id) {
                    targetStatus = 'FINISHED';
                    targetHome = homeScore;
                    targetAway = awayScore;
                } else {
                    // 다른 경기라면 DB에서 상태 조회
                    const otherMatch = await Match.findOne({ id: item.matchId });
                    if (!otherMatch) continue;
                    targetStatus = otherMatch.status;
                    targetHome = otherMatch.score.home;
                    targetAway = otherMatch.score.away;
                }

                // 1. 아직 진행 중인 경기가 하나라도 있으면 '보류'
                if (targetStatus !== 'FINISHED') {
                    isAllFinished = false;
                    // 진행 중이어도 이미 틀린 게 있는지 확인은 해야 함 (생략 가능하지만 더 엄격하게 하려면 추가)
                    continue; 
                }

                // 2. 끝난 경기의 결과 판정
                let itemResult = 'DRAW';
                if (targetHome > targetAway) itemResult = 'HOME';
                if (targetHome < targetAway) itemResult = 'AWAY';

                // 3. 내가 건 픽과 결과가 다르면 -> 즉시 낙첨(LOSE) 확정
                if (item.pick !== itemResult) {
                    isFail = true;
                    break; // 더 볼 필요 없음. 꽝임.
                }
            }
        } 
        // -------------------------------------------------------
        // Case B: 단폴더 (items 없고 matchId만 있는 경우)
        // -------------------------------------------------------
        else {
            if (bet.pick !== currentMatchResult) {
                isFail = true;
            }
            // 단폴더는 경기가 끝났으니 무조건 isAllFinished = true
        }

        // -------------------------------------------------------
        // [최종 판정]
        // -------------------------------------------------------
        const user = await User.findOne({ userid: bet.userId });
        if (!user) continue;

        if (isFail) {
            // 1. 하나라도 틀렸으면 -> 미적중 처리
            bet.status = 'LOSE';
            await bet.save();
            console.log(`   ❌ [미적중] ${bet.nickname} (폴더 중 실패 발생)`);

        } else if (isAllFinished) {
            // 2. 모든 경기가 끝났고 + 틀린 게 하나도 없으면 -> 적중 처리
            const prize = Math.floor(bet.stake * bet.odds);
            user.money += prize;
            await user.save();
            
            bet.status = 'WIN';
            await bet.save();
            console.log(`   💰 [적중] ${bet.nickname}님에게 ${prize.toLocaleString()}원 지급`);
            
        } else {
            // 3. 아직 안 끝난 경기가 남았고 + 지금까지는 다 맞음 -> 대기(PENDING) 유지
            console.log(`   ⏳ [대기] ${bet.nickname} (남은 경기 대기 중)`);
        }
    }

    // 경기 상태 최종 저장
    match.isSettled = true;
    await match.save();
};

// --- 스케줄러 ---
cron.schedule('*/5 * * * *', async () => {
    await fetchFixtures();
});

// 10분마다 전력 분석 및 시뮬레이션 실행
cron.schedule('*/10 * * * *', async () => {
    await fetchTeamFormAndPredict();
});


// ================= API 라우트 =================

// ★ [신규] 시뮬레이션 결과 조회 (프론트에서 Opta 그래프 그릴 때 사용)
app.get('/api/simulation', (req, res) => {
    if (SIMULATION_RESULTS.length === 0) {
        return res.json({ success: false, message: '데이터 분석 중입니다...' });
    }
    res.json({ success: true, data: SIMULATION_RESULTS });
});

app.get('/api/matches', async (req, res) => {
    const matches = await Match.find().sort({ date: 1, time: 1 });
    res.json(matches);
});

// ... (이메일 인증, 로그인, 회원가입 등 기존 코드는 유지) ...
// [수정됨] 이메일 발송 API (에러 로그 출력 기능 추가)
app.post('/api/auth/send-email', async (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationStore[email] = code;
    
    console.log(`📨 [System] 메일 발송 시도: ${email}`); // 시작 로그

    try { 
        await transporter.sendMail({ 
            from: EMAIL_USER, 
            to: email, 
            subject: '[SportBet] 인증번호', 
            text: `인증번호: ${code}` 
        }); 
        
        console.log(`✅ [System] 메일 전송 성공!`); // 성공 로그
        res.json({ success: true }); 
    } catch (e) { 
        // ★ 여기가 핵심! 에러가 나면 상세 내용을 로그에 찍습니다.
        console.error('❌ [Error] 메일 전송 실패 원인:', e); 
        res.status(500).json({ success: false, message: '전송 실패' }); 
    }
});
app.post('/api/auth/verify-email', (req, res) => {
    const { email, code } = req.body;
    if (verificationStore[email] === code) { delete verificationStore[email]; res.json({ success: true }); } 
    else { res.json({ success: false }); }
});

app.post('/api/auth/register', async (req, res) => {
    const { userid, password, nickname, email, phone, bank, accountNumber, accountHolder } = req.body;
    try {
        if (await User.findOne({ userid })) return res.json({ success: false, message: 'ID 중복' });
        await new User({ userid, password, nickname, email, phone, bank, accountNumber, accountHolder }).save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { userid, password } = req.body;
    try {
        const user = await User.findOne({ userid, password });
        if (user) {
            res.json({ 
                success: true, 
                user: { 
                    name: user.nickname, 
                    userid: user.userid, 
                    money: user.money, 
                    role: user.role,
                    // ★ 여기 3줄이 추가되었습니다!
                    bank: user.bank,
                    accountNumber: user.accountNumber,
                    accountHolder: user.accountHolder
                } 
            });
        } else {
            res.status(401).json({ success: false, message: '로그인 실패' });
        }
    } catch (e) { 
        res.status(500).json({ success: false }); 
    }
});

// 1. 아이디 중복 확인
app.post('/api/check/id', async (req, res) => {
    const { userid } = req.body;
    if (!userid) return res.status(400).json({ available: false, message: '아이디를 입력하세요.' });

    try {
        const user = await User.findOne({ userid });
        if (user) {
            // 이미 있으면 사용 불가
            res.json({ available: false, message: '이미 사용 중인 아이디입니다.' });
        } else {
            // 없으면 사용 가능
            res.json({ available: true, message: '사용 가능한 아이디입니다.' });
        }
    } catch (e) {
        res.status(500).json({ available: false, message: '서버 오류' });
    }
});

// 2. 닉네임 중복 확인
app.post('/api/check/nickname', async (req, res) => {
    const { nickname } = req.body;
    if (!nickname) return res.status(400).json({ available: false, message: '닉네임을 입력하세요.' });

    try {
        const user = await User.findOne({ nickname });
        if (user) {
            res.json({ available: false, message: '이미 사용 중인 닉네임입니다.' });
        } else {
            res.json({ available: true, message: '사용 가능한 닉네임입니다.' });
        }
    } catch (e) {
        res.status(500).json({ available: false, message: '서버 오류' });
    }
});

app.post('/api/bet', async (req, res) => {
    const { userid, stake, ticket } = req.body;
    const betAmount = parseInt(stake);
    try {
        const user = await User.findOne({ userid });
        if (!user || user.money < betAmount) return res.json({ success: false, message: '잔액 부족' });

        const matchInfo = await Match.findOne({ id: ticket.matchId });
        const matchName = matchInfo ? `${matchInfo.home} vs ${matchInfo.away}` : 'Unknown';

        // 중복 배팅 체크 (단폴더 기준)
        const matchIdToCheck = ticket.matchId || (ticket.items && ticket.items[0].matchId);
        if (await Bet.findOne({ userId: userid, matchId: matchIdToCheck })) {
            return res.json({ success: false, message: '이미 배팅한 경기입니다.' });
        }

        user.money -= betAmount;
        await user.save();

        await new Bet({
            userId: userid,
            matchId: ticket.matchId,
            pick: ticket.pick,
            items: ticket.items,
            stake: betAmount,
            odds: ticket.odds,
            matchName: matchName
        }).save();

        res.json({ success: true, newBalance: user.money });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// [보안 패치] 배팅 내역 조회 (아이디 없으면 빈 목록 반환)
app.get('/api/my-bets', async (req, res) => {
    const requestUserId = req.query.userid || req.query.userId;

    // ★ [핵심] 아이디가 없으면 DB 검색 자체를 안 함 (빈 리스트 반환)
    if (!requestUserId || requestUserId === 'undefined' || requestUserId === 'null') {
        return res.json({ success: true, bets: [] });
    }

    try {
        const myBets = await Bet.find({ userId: requestUserId }).sort({ betTime: -1 });
        
        const enrichedBets = await Promise.all(myBets.map(async (bet) => {
            let matchInfo = null;
            const targetId = bet.matchId || (bet.items && bet.items[0]?.matchId);
            if (targetId) {
                const match = await Match.findOne({ id: Number(targetId) });
                if (match) matchInfo = { home: match.home, away: match.away, score: match.score, status: match.status };
            }
            return { ...bet._doc, matchDetails: matchInfo || null };
        }));
        
        res.json({ success: true, bets: enrichedBets });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ success: false, bets: [] }); 
    }
});
// [보안 수정] 새로고침 API (아이디 없으면 즉시 차단)
// [보안 패치] 새로고침 API (아이디 없으면 절대 정보 안 줌!)
app.post('/api/user/refresh', async (req, res) => {
    const { userid } = req.body;

    // ★ [핵심] 아이디가 비어있거나 이상하면 즉시 차단!
    if (!userid || userid === 'undefined' || userid === 'null') {
        return res.status(400).json({ success: false, message: '로그인 정보가 없습니다.' });
    }

    try {
        const user = await User.findOne({ userid });
        if (user) {
            res.json({ 
                success: true, 
                user: { 
                    name: user.nickname, 
                    userid: user.userid, 
                    money: user.money, 
                    role: user.role,
                    // 은행 정보도 잊지 않고 챙겨줌
                    bank: user.bank,
                    accountNumber: user.accountNumber,
                    accountHolder: user.accountHolder
                } 
            });
        } else {
            res.status(404).json({ success: false });
        }
    } catch (e) { 
        res.status(500).json({ success: false }); 
    }
});

// 관리자 API들
app.get('/api/admin/users', async (req, res) => {
    const { userid } = req.query; 
    
    // 관리자 권한 체크
    const requester = await User.findOne({ userid });
    if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ success: false, message: '권한 없음' });
    }

    // ★ 중요: { password: 0 }을 지웠습니다. 이제 비밀번호, 계좌 등 모든 정보가 다 나옵니다.
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, users });
});
app.post('/api/admin/give-money', async (req, res) => {
    const { userId, amount } = req.body;
    const user = await User.findOne({ userid: userId });
    if (user) { user.money += parseInt(amount); await user.save(); }
    res.json({ success: true });
});

// 3. [신규] 머니 환수 (뺏기)
app.post('/api/admin/take-money', async (req, res) => {
    const { userId, amount } = req.body;
    const user = await User.findOne({ userid: userId });
    
    if (user) { 
        // 돈 뺏기 (0원 밑으로는 안내려가게 방어해도 되지만, 관리자 권한이니 그냥 뺍니다)
        user.money -= parseInt(amount); 
        await user.save(); 
    }
    res.json({ success: true });
});

app.post('/api/admin/settle', async (req, res) => {
    const { matchId, homeScore, awayScore } = req.body;
    await settleMatchLogic(matchId, homeScore, awayScore);
    res.json({ success: true });
});

app.post('/api/admin/reset-match', async (req, res) => {
    const { matchId } = req.body;
    await Match.findOneAndUpdate({ id: matchId }, { status: 'TIMED', score: { home: 0, away: 0 }, isSettled: false });
    res.json({ success: true });
});

app.post('/api/bet/cancel', async (req, res) => {
    const { betId, userid } = req.body;
    try {
        const bet = await Bet.findById(betId);
        if (!bet || bet.userId !== userid || bet.status !== 'PENDING') return res.status(400).json({});
        
        const matchId = bet.matchId || (bet.items && bet.items[0].matchId);
        const match = await Match.findOne({ id: matchId });
        if (match && match.status !== 'SCHEDULED' && match.status !== 'TIMED') return res.status(400).json({});

        await Bet.findByIdAndDelete(betId);
        const user = await User.findOne({ userid });
        user.money += bet.stake; await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// ================= [누락된 충전/환전 API 복구] =================

// 1. 충전 신청 (이게 없어서 404 오류가 떴던 겁니다)

// [최종 수정] 1. 충전 신청 (아이디로 닉네임 자동 찾기 기능 추가)
app.post('/api/charge/request', async (req, res) => {
    console.log('💰 충전 요청 데이터 수신:', req.body);

    const { amount } = req.body;
    // 프론트에서 userid 혹은 userId 중 하나는 보냈을 것임
    const RequestUserId = req.body.userId || req.body.userid; 

    try {
        if (!RequestUserId) {
            return res.status(400).json({ success: false, message: '로그인 정보(ID)가 없습니다.' });
        }

        // ★ 핵심: 아이디를 가지고 DB에서 유저 정보를 직접 찾습니다.
        const user = await User.findOne({ userid: RequestUserId });
        
        if (!user) {
            return res.status(404).json({ success: false, message: '회원 정보를 찾을 수 없습니다.' });
        }

        // DB에 있는 진짜 닉네임을 사용 (프론트에서 안 보내줘도 됨)
        const realNickname = user.nickname;

        // 충전 요청 저장
        await new Charge({ 
            userId: user.userid,    // DB에 있는 정확한 ID
            nickname: realNickname, // DB에서 찾은 정확한 닉네임
            amount: parseInt(amount) 
        }).save();

        console.log(`✅ [성공] ${realNickname} (${user.userid})님 ${amount}원 충전 신청 완료`);
        res.json({ success: true });

    } catch (e) {
        console.error('⚠️ 충전 신청 에러:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});
// 2. 충전 내역 조회 (사용자 본인 것만)
app.get('/api/charge/list', async (req, res) => {
    const { userid } = req.query;
    try {
        const list = await Charge.find({ userId: userid }).sort({ requestTime: -1 });
        res.json({ success: true, data: list });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// 3. 환전 신청 (이것도 없을 확률이 높아서 미리 추가)
// ================= [환전 및 관리자 기능 보강] =================

// 1. [수정] 환전 신청 (아이디/금액 인식 문제 완벽 해결)
// [수정] 1. 환전 신청 (돈 차감 X, 신청서만 접수 O)
app.post('/api/exchange/request', async (req, res) => {
    console.log('💸 환전 요청 수신:', req.body);

    const { amount, bank, accountNumber } = req.body;
    // 프론트엔드가 보내주는 ID (userid)
    const requestUserId = req.body.userId || req.body.userid;

    try {
        if (!requestUserId) return res.status(400).json({ success: false, message: '로그인 정보 없음' });

        const user = await User.findOne({ userid: requestUserId });
        if (!user) return res.status(404).json({ success: false, message: '유저 없음' });

        const exchangeAmount = parseInt(amount);

        // 1. 잔액이 충분한지 검사는 함
        if (user.money < exchangeAmount) {
            return res.json({ success: false, message: '보유 머니가 부족합니다.' });
        }

        // ★ 핵심: 여기서 돈을 빼지 않습니다! (user.money -= ... 삭제됨)
        // 그냥 통과시킴

        // 2. 환전 신청서만 저장 (상태: PENDING)
        await new Exchange({ 
            userId: user.userid, 
            nickname: user.nickname, 
            amount: exchangeAmount, 
            bank: bank || user.bank, 
            accountNumber: accountNumber || user.accountNumber,
            status: 'PENDING' 
        }).save();

        console.log(`✅ 환전 접수 완료: ${user.nickname}님 ${exchangeAmount}원 (아직 차감 안됨)`);

        // 3. 프론트엔드에 "성공했다"고 응답하면서, 잔액은 "깎이지 않은 현재 잔액"을 그대로 돌려줌
        // 이렇게 하면 프론트엔드에서도 돈이 줄어들지 않고 그대로 표시됨
        res.json({ success: true, newBalance: user.money }); 

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// ================= [관리자 페이지 전용 API] =================

// 1. [충전 목록 조회] 프론트엔드가 'charges'라는 이름을 원함!
app.get('/api/admin/charges', async (req, res) => {
    try {
        const list = await Charge.find().sort({ requestTime: -1 });
        // ★ 수정됨: data -> charges (프론트엔드 요구사항 준수)
        res.json({ success: true, charges: list }); 
    } catch (e) {
        res.status(500).json({ success: false, charges: [] });
    }
});

// 2. [환전 목록 조회] 프론트엔드가 'exchanges'라는 이름을 원함!
app.get('/api/admin/exchanges', async (req, res) => {
    try {
        const list = await Exchange.find().sort({ requestTime: -1 });
        // ★ 수정됨: data -> exchanges
        res.json({ success: true, exchanges: list }); 
    } catch (e) {
        res.status(500).json({ success: false, exchanges: [] });
    }
});

// 3. [배팅 목록 조회] 프론트엔드가 'bets'라는 이름을 원함!
// [수정됨] 관리자 배팅 내역 조회 (유저 정보 + 다폴더 상세 포함)
// [수정] 관리자 배팅 내역 조회 (유저 정보 + 다폴더 상세 + 실명 포함)
app.get('/api/admin/bets', async (req, res) => {
    try {
        // 1. 모든 배팅 내역을 최신순으로 가져옴
        const bets = await Bet.find().sort({ betTime: -1 });
        
        // 2. 각 배팅마다 "누가 걸었는지" 유저 정보를 찾아서 합침
        const enrichedBets = await Promise.all(bets.map(async (bet) => {
            // 배팅한 사람(userId)을 DB에서 찾음
            const user = await User.findOne({ userid: bet.userId });
            
            return {
                ...bet._doc, // 기존 배팅 정보 유지
                // ★ 유저 정보 추가 (닉네임, 예금주)
                userInfo: user ? { 
                    nickname: user.nickname, 
                    name: user.accountHolder || '미등록' 
                } : { nickname: '탈퇴회원', name: '-' }
            };
        }));

        res.json({ success: true, bets: enrichedBets });
    } catch (e) {
        console.error("배팅 내역 조회 실패:", e);
        res.status(500).json({ success: false, bets: [] });
    }
});

// 4. [충전 승인] 입금 확인 -> 유저 돈 올려주기
app.post('/api/admin/approve-charge', async (req, res) => {
    const { chargeId } = req.body;
    try {
        const charge = await Charge.findById(chargeId);
        if (!charge || charge.status === 'COMPLETED') return res.status(400).json({});

        const user = await User.findOne({ userid: charge.userId });
        if (user) {
            user.money += charge.amount; // 돈 지급
            await user.save();
        }

        charge.status = 'COMPLETED'; // 상태 변경
        await charge.save();

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// 5. [환전 승인] 송금 확인 -> 유저 돈 차감하기
app.post('/api/admin/approve-exchange', async (req, res) => {
    const { exchangeId } = req.body;
    try {
        const exchange = await Exchange.findById(exchangeId);
        if (!exchange || exchange.status === 'COMPLETED') return res.status(400).json({});

        const user = await User.findOne({ userid: exchange.userId });
        
        // 유저 돈이 충분한지 확인 후 차감
        if (user && user.money >= exchange.amount) {
            user.money -= exchange.amount;
            await user.save();
            
            exchange.status = 'COMPLETED';
            await exchange.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: '유저 잔액 부족' });
        }
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// ==========================================================

// [필수] 서버 시작 (시뮬레이션 엔진 가동)
app.listen(port, async () => {
    console.log(`Backend running at http://localhost:${port}`);
    // 1. 전력 분석 및 시뮬레이션 시작
    await fetchTeamFormAndPredict(); 
    // 2. 경기 데이터 동기화 (최신 전력 반영된 배당 생성)
    await fetchFixtures();
});