const express = require('express');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite'); // 1. SQLite(기억 장치) 불러오기 (Node 내장 모듈)
const multer = require('multer'); // 이미지 업로드를 처리하기 위한 라이브러리
const aiModel = require('./lunchline-ai-v7'); // AI 모델 모듈 불러오기

const app = express();
app.use(express.json());

// multer 메모리 스토리지 설정 (파일을 메모리에 임시 보관)
const upload = multer({ storage: multer.memoryStorage() });

// 🛡️ 보안 1: CORS 허용 (X-Token 헤더 추가 허용)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Token');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. 데이터베이스(수첩) 준비하기 (팀원의 도커 호환 세팅 유지)
fs.mkdirSync('./data', { recursive: true });
const db = new DatabaseSync('./data/lunchline.db');
console.log('데이터베이스 준비 완료! 🧠');

// 기록을 남길 표(테이블) 만들기
db.exec(`CREATE TABLE IF NOT EXISTS queue_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    count INTEGER,
    estimatedWaitMinutes INTEGER
)`);

// 🚨 우리 서버만의 비밀번호
const SECRET_TOKEN = "lunchline-secure-2024";

// [1] 카메라 서버가 사람 수(또는 이미지)를 보내는 곳
app.post('/api/count', upload.single('image'), async (req, res) => {
    // 🛡️ 보안 2: X-Token 검증 (암호 틀리면 쫓아냄)
    const clientToken = req.headers['x-token'];
    if (clientToken !== SECRET_TOKEN) {
        console.log(`[보안 경고] 비정상적인 접근 시도: ${clientToken}`);
        return res.status(401).send({ message: '접근 거부: 유효하지 않은 토큰입니다.' });
    }

    let newCount = 0;

    try {
        if (req.file && req.file.buffer) {
            console.log('이미지 파일 수신됨. AI 모델 분석 시작...');
            newCount = await aiModel.analyzeImage(req.file.buffer);
        } else if (req.body.image) {
            console.log('Base64 이미지 데이터 수신됨. AI 모델 분석 시작...');
            const imageBuffer = Buffer.from(req.body.image, 'base64');
            newCount = await aiModel.analyzeImage(imageBuffer);
        } else if (req.body.count !== undefined) {
            newCount = Number(req.body.count);
        } else {
            return res.status(400).send({ message: '이미지 파일이나 사람 수 데이터(count)를 전송해주세요.' });
        }

        // 🛡️ 보안 3: 데이터 유효성 검사 (이상한 글자나 음수 튕겨내기)
        if (!Number.isFinite(newCount) || newCount < 0) {
            return res.status(400).send({ message: '유효한 인원수를 도출할 수 없습니다.' });
        }

        // 현재 시간(timestamp)과 예상 대기 시간 계산
        const now = new Date().toISOString();
        const waitTime = Math.round(newCount * 0.5);

        // 🛡️ 보안 4: SQL 인젝션 방어 (? 사용)
        db.prepare(
            `INSERT INTO queue_log (timestamp, count, estimatedWaitMinutes) VALUES (?, ?, ?)`
        ).run(now, newCount, waitTime);
        
        console.log(`[${now}] AI 분석/데이터: ${newCount}명 저장 완료! (대기 예상: ${waitTime}분)`);
        res.send({ message: '저장 성공!', count: newCount });
    } catch (error) {
        console.error('AI 분석 또는 처리 중 에러 발생:', error);
        return res.status(500).send({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

// 📱 [API] 프론트엔드가 상태 물어보는 곳
app.get('/api/queue/status', (req, res) => {
    try {
        // DB에서 가장 최근 기록 1개만 가져오기
        const row = db.prepare(`SELECT * FROM queue_log ORDER BY id DESC LIMIT 1`).get();

        if (!row) {
            return res.send({ currentCount: 0, estimatedWaitMinutes: 0, timestamp: null });
        }

        res.send({
            currentCount: row.count,
            estimatedWaitMinutes: row.estimatedWaitMinutes,
            timestamp: row.timestamp
        });
    } catch (err) {
        res.status(500).send({ message: 'DB 조회 실패' });
    }
});

app.listen(3000, () => {
    console.log('백엔드 보안 서버가 3000번 포트에서 돌아가고 있어요! 🚀🛡️');
});
